import { ref, computed, reactive, watch, nextTick } from "vue";
import type { FormStep, FormAnswers, FormQuestion, QuizConfig } from "~/types/form";
import { getOptionLabel } from "~/types/form";
import { getQuizById, getProgressStepForFormStep } from "~/data/quizConfigs";
import { interpolateFormStep } from "~/utils/textInterpolation";
import { useFormPersistence } from "~/composables/useFormPersistence";
import { scrollToTop } from "~/utils/scrollToTop";
import { products } from "~/data/products";
import { useEverflow } from "~/composables/useEverflow";

export function usePatientForm() {
  // --- STATE MANAGEMENT ---
  const currentProgressMarker = ref(0);
  const currentStepIndex = useState("currentStepIndex", () => 0);
  
  const route = useRoute();
  
  // Determine quiz ID based on productId or categoryId URL parameter
  const selectedQuizId = computed(() => {
    const productId = route.query.productId as string;
    const categoryId = route.query.categoryId as string;

    if (productId) {
      for (const product of products) {
        const variation = product.variations.find(v => v.id === productId);
        if (variation && product.quizId) {
          return product.quizId;
        }
      }
    }

    if (categoryId) {
      return categoryId;
    }

    return "weight-loss";
  });

  // Quiz config — loaded lazily so the 3,300-line formSteps module stays out of
  // the initial bundle. Populated by `loadAndInitQuiz`.
  const selectedQuiz = ref<QuizConfig | null>(null);
  const isQuizReady = ref(false);

  const progressSteps = computed(() => selectedQuiz.value?.progressSteps || []);
  const submissionError = ref<string | null>(null);
  const isLoading = ref(false);
  
  // --- DISQUALIFICATION STATE ---
  const isDisqualified = ref(false);
  const showReviewScreen = ref(false);
  const disqualifyingFields = ref<Array<{ fieldName: string; disqualifyingSelections: string[] }>>([]);
  const skipDisqualificationCheck = ref(false);

  // --- PERSISTENCE ---
  const {
    initializeFormData,
    restoreClientState,
    setupAutoSave,
    clearLocalStorage,
    lastCompletedStep,
    isStepComplete: isStepCompletePersistence,
  } = useFormPersistence(selectedQuizId.value);

  // --- FORM DATA ---
  const allStepsMaster = computed(() => selectedQuiz.value?.steps || []);

  // Reactive form answers (populated when quiz loads)
  const formAnswers: FormAnswers = reactive({});
  let defaultFormAnswers: FormAnswers = {};

  // --- LAZY QUIZ LOADING ---
  const loadAndInitQuiz = async (quizId: string, isInitial: boolean) => {
    const quiz = await getQuizById(quizId);
    if (!quiz) return;

    selectedQuiz.value = quiz;

    // Build default form answers from the quiz's steps
    defaultFormAnswers = {};
    quiz.steps
      .flatMap((step) => step.questions)
      .forEach((q) => {
        if ('startValue' in q && q.startValue === true && q.type === "CHECKBOX" && q.options && q.options.length > 0) {
          defaultFormAnswers[q.id] = getOptionLabel(q.options[0]);
        } else {
          defaultFormAnswers[q.id] = q.type === "MULTISELECT" ? [] : null;
        }
      });

    if (isInitial) {
      // First load — restore persisted state or fall back to defaults
      const { formAnswers: initialFormAnswers, startingStep } = initializeFormData(
        quiz.steps,
        defaultFormAnswers
      );
      Object.assign(formAnswers, initialFormAnswers);

      if (currentStepIndex.value === 0) {
        currentStepIndex.value = startingStep;
      }

      if (process.client) {
        setupAutoSave(formAnswers, currentStepIndex);
        nextTick(async () => {
          restoreClientState(quiz.steps, formAnswers, currentStepIndex);
          preCalculateConditionalOptions(quiz.steps, formAnswers);
          await nextTick();
          const visibleStepsCount = visibleSteps.value.length;
          if (currentStepIndex.value >= visibleStepsCount) {
            currentStepIndex.value = Math.max(0, visibleStepsCount - 1);
          }
        });
      }
    } else {
      // Quiz changed — merge new defaults without overwriting existing answers
      quiz.steps
        .flatMap((step) => step.questions)
        .forEach((q) => {
          if (!(q.id in formAnswers)) {
            formAnswers[q.id] = q.type === "MULTISELECT" ? [] : null;
          }
        });
      currentStepIndex.value = 0;
      scrollToTop();
    }

    isQuizReady.value = true;
  };

  // Kick off the initial quiz load (non-blocking)
  loadAndInitQuiz(selectedQuizId.value, true);

  // --- COMPUTED PROPERTIES ---
  const visibleSteps = computed(() => {
    return allStepsMaster.value.filter((step) => {
      if (step.renderCondition) {
        return step.renderCondition(formAnswers);
      }
      return true;
    });
  });

  const currentStepData = computed(() => {
    const step = visibleSteps.value[currentStepIndex.value];

    if (!step) return null;

    // Interpolate dynamic text with current form answers
    return interpolateFormStep(step, formAnswers);
  });

  const isLastStep = computed(
    () => currentStepIndex.value === visibleSteps.value.length - 1
  );

  // Check if the entire quiz is complete (all visible steps have valid answers)
  const isEntireQuizComplete = computed(() => {
    return visibleSteps.value.every(step => isStepCompletePersistence(step, formAnswers));
  });

  // Use the step completion logic from persistence, but add validation
  const isStepComplete = computed(() => {
    if (!currentStepData.value) {
      return false;
    }

    // First check basic completion using persistence logic
    const persistenceComplete = isStepCompletePersistence(
      currentStepData.value,
      formAnswers
    );

    if (!persistenceComplete) {
      return false;
    }

    // Then check validation rules if they exist
    const validationComplete = currentStepData.value.questions.every(
      (question: FormQuestion) => {
        if (question.type === "MARKETING" || question.type === "BEFORE_AFTER") {
          return true;
        }
        if (!question.required) {
          return true;
        }

        const answer = formAnswers[question.id];

        // If question has validation rules, validate against them
        if ("validation" in question && question.validation) {
          // The validation utilities were removed, so this part of the logic is now
          // effectively a placeholder or will need to be re-implemented if specific
          // validation is required. For now, we'll assume it's valid if no rules.
          return true;
        }

        return true;
      }
    );

    return validationComplete;
  });

  // --- API SUBMISSION WRAPPER ---
  const handleFormSubmission = () => {
    // The submitPatientForm utility was removed, so this function is now a placeholder.
    // In a real scenario, you would call an API here to submit the form data.
    console.log(
      "Form submission logic removed. Placeholder for actual submission."
    );
    // Example: axios.post('/api/submit-form', formAnswers);
  };

  // --- SUBMISSION LOGIC ---
  // Extracted so it can be called from both nextStep (last step) and auto-advance (all steps complete)
  const finishQuiz = async () => {
    // DISQUALIFICATION CHECK: Before submitting, check if user has disqualifying conditions
    // (skip if we just came from the review screen confirmation)
    if (!skipDisqualificationCheck.value) {
      const disqualifications = checkForDisqualifyingConditions();

      if (disqualifications.length > 0) {
        // User has disqualifying conditions - trigger review flow
        disqualifyingFields.value = disqualifications;
        showReviewScreen.value = true;
        scrollToTop();
        return; // Don't proceed with submission
      }
    } else {
      // Reset the skip flag for future submissions
      skipDisqualificationCheck.value = false;
    }

    // Set loading state immediately to disable button
    isLoading.value = true;

    try {
      // Store quiz-specific completion state
      if (process.client) {
        localStorage.setItem(
          `quiz_${selectedQuizId.value}_completed`,
          "true"
        );
      }
      const everflow = useEverflow();
      const customerio = useCustomerio();

      const email = (formAnswers.email || "").trim();
        if (email) {
          everflow.completeQuiz({ email });

          // Customer.io: Identify as lead and track quiz completion
          // Convert all formAnswers from camelCase to snake_case for Customer.io
          const { convertObjectKeysToSnakeCase } = await import('~/utils/camelToSnake')
          const snakeCaseAttributes = convertObjectKeysToSnakeCase(formAnswers)

          customerio.completedQuiz(email, snakeCaseAttributes);
        } else {
          // Still fire the event if you want, without email
          everflow.completeQuiz();
        }
      // Navigate to checkout, preserving productId or categoryId
      const route = useRoute();
      const productId = route.query.productId as string;
      const categoryId = route.query.categoryId as string;

      // Build query params
      const queryParams: Record<string, string> = {};

      if (productId) {
        queryParams.productId = productId;
      }

      if (categoryId && !productId) {
        queryParams.categoryId = categoryId;
      }

      // Preserve all tracking parameters (UTM, Everflow, promo)
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'promo',
        'affid', 'oid', 'uid', 'affid2', 'oid2', 'uid2',
        'sub1', 'sub2', 'sub3', 'sub4', 'sub5', 'source_id',
        '_ef_transaction_id'
      ];
      trackingParams.forEach(param => {
        if (route.query[param]) {
          queryParams[param] = route.query[param] as string;
        }
      });

      // Convert query params to URL string
      const queryString = new URLSearchParams(queryParams).toString();
      await navigateTo(`/checkout?${queryString}`);
    } catch (error) {
      submissionError.value = "Failed to complete form. Please try again.";
    } finally {
      isLoading.value = false;
    }
  };

  // --- NAVIGATION FUNCTIONS ---
  const nextStep = async () => {
    if (!isStepComplete.value) {
      return;
    }

    if (isLastStep.value) {
      await finishQuiz();
    } else {
      currentStepIndex.value++;
      scrollToTop();
    }
  };

  const prevStep = () => {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--;
      scrollToTop();
    }
  };

  // --- DISQUALIFICATION LOGIC ---
  
  /**
   * Configuration for disqualifying conditions per quiz type
   * For weight-loss quiz: GLP-1 medications have specific contraindications
   */
  const DISQUALIFICATION_CONFIG: Record<string, Record<string, string[]>> = {
    'weight-loss': {
      // Pregnancy-related contraindications
      pregnancyStatus: [
        "Currently or possibly pregnant",
        "Breastfeeding or bottle-feeding with breastmilk",
      ],
      // Diabetes contraindications (from medicalConditions1)
      medicalConditions1: [
        "Type 1 diabetes",
        "Type 2 Diabetes (on insulin or sulfonylureas)",
      ],
      // Medical contraindications (from medicalConditions2)
      medicalConditions2: [
        "Gallbladder disease",
        "Cirrhosis or end-stage liver disease",
        "End-stage kidney disease (on or about to be on dialysis)",
        "History of or current pancreatitis",
        "Current suicidal thoughts or prior suicide attempt",
        "Diabetic retinopathy (diabetic eye disease), damage to the optic nerve from trauma or reduced blood flow, or blindness",
        "On blood thinners/warfarin",
        "Cancer (active diagnosis, active treatment, or in remission or cancer-free for less than 5 continuous years - does not apply to non-melanoma skin cancer that was considered cured via simple excision)"
      ],
    }
  };

  /**
   * Check if the user has any disqualifying conditions based on their answers
   */
  const checkForDisqualifyingConditions = (): Array<{ fieldName: string; disqualifyingSelections: string[] }> => {
    const quizConfig = DISQUALIFICATION_CONFIG[selectedQuizId.value];
    
    // If no disqualification config for this quiz, return empty
    if (!quizConfig) {
      return [];
    }

    const disqualifications: Array<{ fieldName: string; disqualifyingSelections: string[] }> = [];

    // Check each field in the configuration
    Object.entries(quizConfig).forEach(([fieldName, disqualifyingOptions]) => {
      const userAnswer = formAnswers[fieldName];
      
      if (!userAnswer) return;

      // Handle MULTISELECT answers (array)
      if (Array.isArray(userAnswer)) {
        const selectedDisqualifyingOptions = userAnswer.filter((selection: string) =>
          disqualifyingOptions.includes(selection)
        );

        if (selectedDisqualifyingOptions.length > 0) {
          disqualifications.push({
            fieldName,
            disqualifyingSelections: selectedDisqualifyingOptions
          });
        }
      }
      // Handle SINGLESELECT answers (string)
      else if (typeof userAnswer === 'string') {
        if (disqualifyingOptions.includes(userAnswer)) {
          disqualifications.push({
            fieldName,
            disqualifyingSelections: [userAnswer]
          });
        }
      }
    });

    return disqualifications;
  };

  /**
   * Trigger disqualification review flow
   */
  const triggerDisqualificationReview = () => {
    const disqualifications = checkForDisqualifyingConditions();
    
    if (disqualifications.length > 0) {
      disqualifyingFields.value = disqualifications;
      showReviewScreen.value = true;
      scrollToTop();
    }
  };

  /**
   * Handle user confirming their answers after review
   */
  const confirmReviewedAnswers = () => {
    // Check again if they still have disqualifying conditions
    const disqualifications = checkForDisqualifyingConditions();
    
    if (disqualifications.length > 0) {
      // Still disqualified - show final disqualification screen
      isDisqualified.value = true;
      showReviewScreen.value = false;
      scrollToTop();
    } else {
      // No longer disqualified - proceed with form submission
      showReviewScreen.value = false;
      // Set flag to skip the disqualification check in nextStep (we just checked)
      skipDisqualificationCheck.value = true;
      // Continue with the normal submission flow
      nextStep();
    }
  };

  /**
   * Handle user going back from review screen
   */
  const backFromReview = () => {
    showReviewScreen.value = false;
    // Don't change isDisqualified here - let them modify answers
  };

  /**
   * Reset disqualification state (useful for testing or form restart)
   */
  const resetDisqualificationState = () => {
    isDisqualified.value = false;
    showReviewScreen.value = false;
    disqualifyingFields.value = [];
    skipDisqualificationCheck.value = false;
  };

  // --- WATCHER TO SYNC PROGRESS BAR ---
  watch(
    currentStepIndex,
    (newIndex) => {
      const currentId = visibleSteps.value[newIndex]?.id;
      if (!currentId || !selectedQuiz.value) return;

      // Get the progress step for the current form step
      const progressStepId = getProgressStepForFormStep(
        selectedQuiz.value,
        currentId
      );
      if (progressStepId) {
        const progressIndex = progressSteps.value.findIndex(
          (step) => step.id === progressStepId
        );
        if (progressIndex !== -1) {
          currentProgressMarker.value = progressIndex;
        }
      }
    },
    { immediate: true }
  );

  // --- WATCHER TO HANDLE CONDITIONAL STEPS ---
  // This ensures currentStepIndex stays valid when steps are conditionally hidden
  watch(visibleSteps, (newVisibleSteps) => {
    // If current step index is out of bounds, reset to 0
    if (currentStepIndex.value >= newVisibleSteps.length) {
      currentStepIndex.value = 0;
      scrollToTop();
    }
  });

  // --- WATCHER TO HANDLE QUIZ CHANGES ---
  watch(selectedQuizId, async (newQuizId, oldQuizId) => {
    if (newQuizId !== oldQuizId && oldQuizId) {
      isQuizReady.value = false;
      await loadAndInitQuiz(newQuizId, false);
    }
  });

  // --- WATCHER TO HANDLE DEPENDENT FIELD CHANGES ---
  // This ensures dependent fields are cleared when parent fields change

  // Define field dependencies - when a parent field changes, clear its dependent fields
  const fieldDependencies = {
    currentGlp1Type: [
      "lastDoseStrength",
      "lastDoseMonth",
      "lastDoseDay",
      "lastDoseYear",
    ],
    // Add more field dependencies here as needed
    // exampleField: ['dependentField1', 'dependentField2']
  };

  // Watch for changes in parent fields and clear dependent fields
  Object.entries(fieldDependencies).forEach(
    ([parentField, dependentFields]) => {
      watch(
        () => formAnswers[parentField],
        (newValue, oldValue) => {
          if (newValue !== oldValue && oldValue !== undefined) {
            clearDependentFields(parentField, dependentFields);

            // Re-calculate conditional options when dependencies change
            preCalculateConditionalOptions(allStepsMaster.value, formAnswers);
          }
        }
      );
    }
  );

  // --- UTILITY FUNCTIONS ---

  // Function to clear dependent fields when parent field changes
  const clearDependentFields = (
    parentFieldId: string,
    dependentFieldIds: string[]
  ) => {
    const parentValue = formAnswers[parentFieldId];

    if (parentValue !== null && parentValue !== undefined) {
      dependentFieldIds.forEach((fieldId) => {
        if (
          formAnswers[fieldId] !== null &&
          formAnswers[fieldId] !== undefined
        ) {
          formAnswers[fieldId] = null;
        }
      });
    }
  };

  // Function to check if a specific quiz has been completed
  const isQuizCompleted = (quizId: string): boolean => {
    if (!process.client) return false;
    return localStorage.getItem(`quiz_${quizId}_completed`) === "true";
  };

  // Function to get all completed quiz IDs
  const getCompletedQuizIds = (): string[] => {
    if (!process.client) return [];

    const completedQuizzes: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("quiz_") && key.endsWith("_completed")) {
        const quizId = key.replace("quiz_", "").replace("_completed", "");
        completedQuizzes.push(quizId);
      }
    }
    return completedQuizzes;
  };

  // Function to pre-calculate all conditional options based on restored form answers
  const preCalculateConditionalOptions = (
    allSteps: any[],
    formAnswers: FormAnswers
  ) => {
    // Check if we already have valid pre-calculated options
    const existingOptions = formAnswers._preCalculatedOptions;
    let hasValidOptions = false;

    if (existingOptions && typeof existingOptions === "object") {
      // Check if we have options for questions with dynamic options
      const questionsWithDynamicOptions = allSteps.flatMap(
        (step) =>
          step.questions?.filter(
            (q: any) =>
              (q.type === "DROPDOWN" || q.type === "SINGLESELECT") &&
              typeof q.options === "function"
          ) || []
      );

      hasValidOptions = questionsWithDynamicOptions.every(
        (q: any) =>
          existingOptions[q.id] &&
          Array.isArray(existingOptions[q.id]) &&
          existingOptions[q.id].length > 0
      );
    }

    // If we have valid existing options, use them
    if (hasValidOptions) {
      return;
    }

    // Otherwise, calculate new options
    const preCalculatedOptions: Record<string, any> = {};

    allSteps.forEach((step) => {
      // Check if step should be visible based on current form answers
      if (step.renderCondition && !step.renderCondition(formAnswers)) {
        return; // Skip this step if it's not visible
      }

      step.questions?.forEach((question: any) => {
        // Handle questions with dynamic options (function-based)
        if (
          question.type === "DROPDOWN" &&
          typeof question.options === "function"
        ) {
          try {
            const options = question.options(formAnswers);
            preCalculatedOptions[question.id] = options;
          } catch (error) {
            console.warn(
              `Failed to pre-calculate options for ${question.id}:`,
              error
            );
            preCalculatedOptions[question.id] = [];
          }
        }
        // Handle other question types with dynamic options if needed
        else if (
          question.type === "SINGLESELECT" &&
          typeof question.options === "function"
        ) {
          try {
            const options = question.options(formAnswers);
            preCalculatedOptions[question.id] = options;
          } catch (error) {
            console.warn(
              `Failed to pre-calculate options for ${question.id}:`,
              error
            );
            preCalculatedOptions[question.id] = [];
          }
        }
      });
    });

    // Store the pre-calculated options in the form answers for easy access
    // This will be automatically persisted by the auto-save functionality
    Object.assign(formAnswers, { _preCalculatedOptions: preCalculatedOptions });

    // Also store in localStorage for immediate persistence
    if (process.client) {
      try {
        const currentData = localStorage.getItem(
          `quiz_${selectedQuizId.value}_data`
        );
        if (currentData) {
          const parsedData = JSON.parse(currentData);
          parsedData._preCalculatedOptions = preCalculatedOptions;
          localStorage.setItem(
            `quiz_${selectedQuizId.value}_data`,
            JSON.stringify(parsedData)
          );
        }
      } catch (error) {
        console.warn("Failed to persist pre-calculated options:", error);
      }
    }
  };

  // Make the function globally available for the persistence layer
  if (process.client) {
    (window as any).preCalculateConditionalOptions = (
      allSteps: any[],
      formAnswers: FormAnswers
    ) => {
      // Prevent duplicate calls - if we already have options, skip
      if (
        formAnswers._preCalculatedOptions &&
        Object.keys(formAnswers._preCalculatedOptions).length > 0
      ) {
        return;
      }

      // Get the current quiz ID from the route - handle cases where route might not be available
      let quizId = "weight-loss"; // Default fallback

      try {
        const route = useRoute();
        if (route && route.query) {
          const categoryId = route.query.categoryId as string;
          if (categoryId) {
            quizId = categoryId;
          }
        }
      } catch (error) {
        console.warn(
          "Could not determine quiz ID from route, using default:",
          error
        );
      }

      // Check if we already have valid pre-calculated options
      const existingOptions = formAnswers._preCalculatedOptions;
      let hasValidOptions = false;

      if (existingOptions && typeof existingOptions === "object") {
        // Check if we have options for questions with dynamic options
        const questionsWithDynamicOptions = allSteps.flatMap(
          (step) =>
            step.questions?.filter(
              (q: any) =>
                (q.type === "DROPDOWN" || q.type === "SINGLESELECT") &&
                typeof q.options === "function"
            ) || []
        );

        hasValidOptions = questionsWithDynamicOptions.every(
          (q: any) =>
            existingOptions[q.id] &&
            Array.isArray(existingOptions[q.id]) &&
            existingOptions[q.id].length > 0
        );
      }

      // If we have valid existing options, use them
      if (hasValidOptions) {
        return;
      }

      // Otherwise, calculate new options
      const preCalculatedOptions: Record<string, any> = {};

      allSteps.forEach((step) => {
        // Check if step should be visible based on current form answers
        if (step.renderCondition && !step.renderCondition(formAnswers)) {
          return; // Skip this step if it's not visible
        }

        step.questions?.forEach((question: any) => {
          // Handle questions with dynamic options (function-based)
          if (
            question.type === "DROPDOWN" &&
            typeof question.options === "function"
          ) {
            try {
              const options = question.options(formAnswers);
              preCalculatedOptions[question.id] = options;
            } catch (error) {
              console.warn(
                `Failed to pre-calculate options for ${question.id}:`,
                error
              );
              preCalculatedOptions[question.id] = [];
            }
          }
          // Handle other question types with dynamic options if needed
          else if (
            question.type === "SINGLESELECT" &&
            typeof question.options === "function"
          ) {
            try {
              const options = question.options(formAnswers);
              preCalculatedOptions[question.id] = options;
            } catch (error) {
              console.warn(
                `Failed to pre-calculate options for ${question.id}:`,
                error
              );
              preCalculatedOptions[question.id] = [];
            }
          }
        });
      });

      // Store the pre-calculated options in the form answers for easy access
      Object.assign(formAnswers, {
        _preCalculatedOptions: preCalculatedOptions,
      });
      // Also store in localStorage for immediate persistence
      try {
        const currentData = localStorage.getItem(`quiz_${quizId}_data`);
        if (currentData) {
          const parsedData = JSON.parse(currentData);
          parsedData._preCalculatedOptions = preCalculatedOptions;
          localStorage.setItem(
            `quiz_${quizId}_data`,
            JSON.stringify(parsedData)
          );
        } else {
          console.warn(
            `No existing localStorage data found for quiz ${quizId}`
          );
        }
      } catch (error) {
        console.warn("Failed to persist pre-calculated options:", error);
      }
    };
  }

  const clearFormAndRestart = () => {
    if (window.confirm("Are you sure you want to restart the form?")) {
      clearLocalStorage();
      // Reset form answers to defaults
      Object.keys(formAnswers).forEach((key) => {
        formAnswers[key] = Array.isArray(defaultFormAnswers[key]) ? [] : null;
      });
      currentStepIndex.value = 0;
      scrollToTop();
    } else {
      return;
    }
  };

  return {
    currentQuestionIndex: currentStepIndex,
    formAnswers,
    currentStepData,
    isLastQuestion: isLastStep,
    isStepComplete,
    nextStep,
    prevStep,
    submissionError,
    isLoading,
    isQuizReady,
    clearFormAndRestart,
    clearDependentFields,
    fieldDependencies,
    isQuizCompleted,
    getCompletedQuizIds,
    preCalculateConditionalOptions,
    lastCompletedStep,
    currentProgressMarker,
    progressSteps,
    selectedQuizId,
    // Quiz completion
    isEntireQuizComplete,
    finishQuiz,
    // Disqualification exports
    isDisqualified,
    showReviewScreen,
    disqualifyingFields,
    checkForDisqualifyingConditions,
    triggerDisqualificationReview,
    confirmReviewedAnswers,
    backFromReview,
    resetDisqualificationState,
  };
}
