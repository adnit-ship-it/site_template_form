import { ref, computed, watch, type Ref } from "vue";
import type { FormAnswers, FormStep } from "~/types/form";
import { validateFieldWithRules } from "~/utils/validation";

export function useFormPersistence(quizId: string) {
  // --- STORAGE KEYS ---
  const STORAGE_KEY = `quiz_${quizId}_data`;
  const STEP_STORAGE_KEY = `quiz_${quizId}_step`;
  const UNIVERSAL_ID_UPLOAD_KEY = 'universal_id_upload'; // Shared across all quizzes
  const FILE_INPUT_KEYS: Record<string, string> = {
    womensHRTPrescriptions: 'file_upload_womens_hrt_prescriptions',
    hrtLabWork: 'file_upload_hrt_lab_work',
  };

  // --- STATE ---
  const isInitialized = ref(false);
  const lastCompletedStep = ref<number>(-1);

  // --- UTILITIES ---
  const saveToLocalStorage = (data: any, key: string) => {
    if (!process.client) return;

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save to localStorage for quiz ${quizId}:`, error);
    }
  };

  const loadFromLocalStorage = (key: string) => {
    if (!process.client) return null;

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to load from localStorage for quiz ${quizId}:`, error);
      return null;
    }
  };

  const clearLocalStorage = () => {
    if (!process.client) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_STORAGE_KEY);
      localStorage.removeItem(UNIVERSAL_ID_UPLOAD_KEY);
      for (const storageKey of Object.values(FILE_INPUT_KEYS)) {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error(`Failed to clear localStorage for quiz ${quizId}:`, error);
    }
  };

  // --- FORM DATA PERSISTENCE ---
  const saveFormData = (formAnswers: FormAnswers) => {
    // Create a copy of formAnswers without file data to avoid localStorage quota issues
    const formAnswersWithoutFiles = { ...formAnswers };
    
    // Special handling for idUploadUniversal - save it separately and share across all quizzes
    if (formAnswers.idUploadUniversal && 
        typeof formAnswers.idUploadUniversal === 'object' && 
        'contentType' in formAnswers.idUploadUniversal && 
        'data' in formAnswers.idUploadUniversal) {
      saveToLocalStorage(formAnswers.idUploadUniversal, UNIVERSAL_ID_UPLOAD_KEY);
    }

    // Save other known file inputs to their own dedicated keys
    for (const [fieldId, storageKey] of Object.entries(FILE_INPUT_KEYS)) {
      const value = formAnswers[fieldId];
      if (value && typeof value === 'object' && 'contentType' in value && 'data' in value) {
        saveToLocalStorage(value, storageKey);
      }
    }
    
    // Remove all file objects from the main form answers payload
    Object.keys(formAnswersWithoutFiles).forEach(key => {
      const value = formAnswersWithoutFiles[key];
      if (value && typeof value === 'object' && 'contentType' in value && 'data' in value) {
        delete formAnswersWithoutFiles[key];
      }
    });
    
    saveToLocalStorage(formAnswersWithoutFiles, STORAGE_KEY);
  };

  const loadFormData = (): FormAnswers | null => {
    const data = loadFromLocalStorage(STORAGE_KEY);
    
    if (data) {
      // Restore universal ID upload
      const universalIdUpload = loadFromLocalStorage(UNIVERSAL_ID_UPLOAD_KEY);
      if (universalIdUpload) {
        data.idUploadUniversal = universalIdUpload;
      }

      // Restore other file inputs from their dedicated keys
      for (const [fieldId, storageKey] of Object.entries(FILE_INPUT_KEYS)) {
        const fileData = loadFromLocalStorage(storageKey);
        if (fileData) {
          data[fieldId] = fileData;
        }
      }
    }
    
    return data;
  };

  // --- STEP PERSISTENCE ---
  const saveCurrentStep = (stepIndex: number) => {
    saveToLocalStorage(stepIndex, STEP_STORAGE_KEY);
  };

  const loadLastStep = (): number => {
    const step = loadFromLocalStorage(STEP_STORAGE_KEY);
    return step !== null ? step : -1;
  };

  // --- STEP COMPLETION LOGIC ---
  const isStepComplete = (
    step: FormStep,
    formAnswers: FormAnswers
  ): boolean => {
    return step.questions.every((question) => {
      // Skip validation for questions that aren't visible due to renderCondition
      if (question.renderCondition && !question.renderCondition(formAnswers)) {
        return true; // Consider hidden questions as complete
      }

      const answer = formAnswers[question.id];

      if (!question.required) {
        return true;
      }

      if (answer === null || answer === undefined || answer === "") {
        return false;
      }

      // For multiselect fields, check if array is empty
      if (question.type === "MULTISELECT") {
        return Array.isArray(answer) && answer.length > 0;
      }

      // For file inputs, check if file exists
      if (question.type === "FILE_INPUT") {
        return answer !== null;
      }

      // For dropdown fields, check if the selected value is a valid option
      if (question.type === "DROPDOWN") {
        let validOptions: (string | number)[] = [];
        
        // First try to use pre-calculated options if available
        if (formAnswers._preCalculatedOptions && 
            formAnswers._preCalculatedOptions[question.id]) {
          validOptions = formAnswers._preCalculatedOptions[question.id];
        }
        // Fallback to dynamic calculation
        else if (typeof question.options === 'function') {
          validOptions = question.options(formAnswers);
        } else {
          validOptions = question.options;
        }
        
        // Check if the selected answer is in the valid options
        return validOptions.includes(answer);
      }

      // For marketing, before/after, medical review, perfect, and weight summary pages, always consider them complete
      if (["MARKETING", "BEFORE_AFTER", "MEDICAL_REVIEW", "PERFECT", "WEIGHT_SUMMARY"].includes(question.type)) {
        return true;
      }

      // For fields with validation rules, check if the value is valid
      if (
        "validation" in question &&
        question.validation &&
        question.validation.length > 0
      ) {
        const result = validateFieldWithRules(
          answer,
          question.validation,
          formAnswers
        );
        return result.isValid;
      }

      return true;
    });
  };

  const getLastCompletedStepIndex = (
    allSteps: FormStep[],
    formAnswers: FormAnswers
  ): number => {
    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];
      
      if (step && !isStepComplete(step, formAnswers)) {
        return i - 1; // Return the last completed step
      }
    }
    
    return allSteps.length - 1; // All steps completed
  };

  const getNextIncompleteStepIndex = (
    allSteps: FormStep[],
    formAnswers: FormAnswers
  ): number => {
    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];
      
      if (step && !isStepComplete(step, formAnswers)) {
        return i; // Return the first incomplete step
      }
    }
    
    return allSteps.length - 1; // All steps completed, return last step
  };

  // --- INITIALIZATION ---
  const initializeFormData = (
    allSteps: FormStep[],
    defaultFormAnswers: FormAnswers
  ): { formAnswers: FormAnswers; startingStep: number } => {
    // Always return default state for consistent server/client rendering
    return { formAnswers: { ...defaultFormAnswers }, startingStep: 0 };
  };

  // --- CLIENT-SIDE STATE RESTORATION ---
  const restoreClientState = (
    allSteps: FormStep[],
    formAnswers: FormAnswers,
    currentStepIndex: Ref<number>
  ) => {
    if (!process.client) return;

    const savedData = loadFormData();

    if (savedData) {
      // Update form answers with saved data
      Object.assign(formAnswers, savedData);

      // 🔧 CRITICAL FIX: Pre-calculate conditional options BEFORE step validation
      // This ensures options are available when determining step completion
      // Without this, the form falls back to earlier steps on double refresh
      if (typeof window !== 'undefined' && (window as any).preCalculateConditionalOptions) {
        (window as any).preCalculateConditionalOptions(allSteps, formAnswers);
      }

      // Filter steps based on conditions (same logic as in usePatientForm)
      const visibleSteps = allSteps.filter((step) => {
        if (step.renderCondition) {
          return step.renderCondition(formAnswers);
        }
        return true;
      });

      // Determine starting step based on completion status using visible steps
      const lastCompleted = getLastCompletedStepIndex(
        visibleSteps,
        formAnswers
      );
      const nextIncomplete = getNextIncompleteStepIndex(
        visibleSteps,
        formAnswers
      );

      currentStepIndex.value =
        lastCompleted === visibleSteps.length - 1
          ? visibleSteps.length - 1
          : nextIncomplete;

      lastCompletedStep.value = lastCompleted;
    } else {
      // Try to migrate data from old storage format
      const migratedData = migrateOldData();
      if (migratedData) {
        Object.assign(formAnswers, migratedData);
        
        // 🔧 CRITICAL FIX: Pre-calculate conditional options BEFORE step validation
        if (typeof window !== 'undefined' && (window as any).preCalculateConditionalOptions) {
          (window as any).preCalculateConditionalOptions(allSteps, formAnswers);
        }
        
        // Save migrated data to new quiz-specific storage
        saveFormData(migratedData);
        
        // Determine starting step
        const visibleSteps = allSteps.filter((step) => {
          if (step.renderCondition) {
            return step.renderCondition(formAnswers);
          }
          return true;
        });

        const lastCompleted = getLastCompletedStepIndex(
          visibleSteps,
          formAnswers
        );
        const nextIncomplete = getNextIncompleteStepIndex(
          visibleSteps,
          formAnswers
        );

        currentStepIndex.value =
          lastCompleted === visibleSteps.length - 1
            ? visibleSteps.length - 1
            : nextIncomplete;

        lastCompletedStep.value = lastCompleted;
      } else {
        lastCompletedStep.value = -1;
      }
    }

    isInitialized.value = true;
  };

  // --- DATA MIGRATION ---
  const migrateOldData = (): FormAnswers | null => {
    if (!process.client) return null;

    try {
      // Try to load data from old storage keys
      const oldDataKey = "medical-intake-form-data";
      const oldStepKey = "medical-intake-form-step";
      
      const oldData = localStorage.getItem(oldDataKey);
      const oldStep = localStorage.getItem(oldStepKey);
      
      if (oldData) {
        const parsedData = JSON.parse(oldData);
        
        // If this is the GLP-1 quiz (default), migrate the data
        if (quizId === 'glp1-weight-loss') {
          // Clean up old storage
          localStorage.removeItem(oldDataKey);
          localStorage.removeItem(oldStepKey);
          
          return parsedData;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to migrate old data for quiz ${quizId}:`, error);
      return null;
    }
  };

  // --- UTILITY FUNCTIONS ---
  const getAllQuizData = () => {
    if (!process.client) return {};
    
    const allData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quiz_') && key.endsWith('_data')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            allData[key] = JSON.parse(data);
          }
        } catch (error) {
          console.error(`Failed to parse data for key ${key}:`, error);
        }
      }
    }
    return allData;
  };

  const clearAllQuizData = () => {
    if (!process.client) return;
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quiz_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to clear key ${key}:`, error);
      }
    });
  };

  // --- AUTO-SAVE ---
  const setupAutoSave = (
    formAnswers: FormAnswers,
    currentStep: Ref<number>
  ) => {
    if (!process.client) return;

    // Save form data whenever it changes
    watch(
      formAnswers,
      (newData) => {
        saveFormData(newData);
      },
      { deep: true }
    );

    // Save current step whenever it changes
    watch(currentStep, (newStep) => {
      saveCurrentStep(newStep);
    });
  };

  return {
    // State
    isInitialized,
    lastCompletedStep,

    // Core functions
    initializeFormData,
    restoreClientState,
    setupAutoSave,
    saveFormData,
    loadFormData,
    saveCurrentStep,
    loadLastStep,
    clearLocalStorage,
    getAllQuizData,
    clearAllQuizData,

    // Utility functions
    isStepComplete,
    getLastCompletedStepIndex,
    getNextIncompleteStepIndex,
  };
}
