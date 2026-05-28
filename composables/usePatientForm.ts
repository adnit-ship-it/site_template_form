import { ref, computed, reactive, watch, nextTick, toRef } from "vue";
import type { FormStep, FormAnswers, FormQuestion, QuizConfig } from "~/types/form";
import { getOptionLabel } from "~/types/form";
import { getQuizById, getProgressStepForFormStep, getDefaultQuizId } from "~/data/quizConfigs";
import { interpolateFormStep } from "~/utils/textInterpolation";
import { useFormPersistence } from "~/composables/useFormPersistence";
import { scrollToTop } from "~/utils/scrollToTop";
import { useProductsCatalog } from "~/composables/useProductsCatalog";
import { useEverflow } from "~/composables/useEverflow";
import { pushDataLayer } from "~/utils/dataLayer";
import { createAbandonedLead } from "~/utils/createAbandonedLead";

// ---------------------------------------------------------------------------
// Per-quiz singleton registry
// ---------------------------------------------------------------------------
// Backed by Nuxt's `useState` so it's a true singleton across all components
// and survives SSR hydration. Keyed by quizId so multiple quizzes can be in
// flight simultaneously without their answers bleeding into each other —
// this mirrors the on-disk layout (`quiz_<id>_data` per quiz).
//
// Every call to `usePatientForm()` returns derived refs/objects bound to the
// active quiz's entry in this registry. That means all components mounted
// during a given quiz session share the SAME reactive `formAnswers` object,
// which removes the round-trip-through-localStorage coupling between
// `consultation.vue`, `useCheckout`, `StepLayout`, etc.

// `QuizState` is what lives in `useState` (the registry). It MUST be
// JSON-serializable for the Nuxt SSR -> client hydration payload — devalue
// chokes on Promises, functions, and class instances.
//
// The non-serializable per-quiz pieces (the loaded `QuizConfig`, which
// contains function-typed `renderCondition` / `disqualifyCondition` /
// `options`; the in-flight `initPromise`; and the client-only watcher
// guard) are kept in module-level maps below. None of those are
// user-specific — the quiz config is the same for every request, the init
// promise just coordinates work, and the watcher flag is client-only —
// so sharing them across requests on the server is safe.
interface QuizState {
  answers: FormAnswers;
  defaultAnswers: FormAnswers;
  stepIndex: number;
  lastCompletedStep: number;
  isReady: boolean;
  isInitialized: boolean;
}

const loadedQuizConfigs = new Map<string, QuizConfig>();
const inFlightInitPromises = new Map<string, Promise<void>>();
const quizWatchersAttached = new Set<string>();

function getQuizConfig(quizId: string): QuizConfig | null {
  return loadedQuizConfigs.get(quizId) ?? null;
}

function useQuizRegistry() {
  return useState<Record<string, QuizState>>("quizRegistry", () => ({}));
}

function ensureQuizState(quizId: string): QuizState {
  const registry = useQuizRegistry();
  if (!registry.value[quizId]) {
    registry.value[quizId] = reactive({
      answers: {} as FormAnswers,
      defaultAnswers: {} as FormAnswers,
      stepIndex: 0,
      lastCompletedStep: -1,
      isReady: false,
      isInitialized: false,
    }) as unknown as QuizState;
  }
  return registry.value[quizId];
}

/**
 * Drop a quiz's in-memory state. Called from `submitPatientForm` after a
 * successful submission so a subsequent visit starts from a clean slate.
 * localStorage is cleared separately via `useFormPersistence(...).clearLocalStorage()`.
 */
export function resetQuizState(quizId: string) {
  const registry = useQuizRegistry();
  delete registry.value[quizId];
  inFlightInitPromises.delete(quizId);
  quizWatchersAttached.delete(quizId);
  // `loadedQuizConfigs` intentionally not cleared — the config is immutable
  // and re-using the cached copy avoids a re-import.
}

// ---------------------------------------------------------------------------
// Conditional-option pre-calculator
// ---------------------------------------------------------------------------
// For DROPDOWN / SINGLESELECT questions whose `options` is a function of
// other answers, memoize the result into `formAnswers._preCalculatedOptions`
// (and mirror to localStorage) so step-completion checks on refresh don't
// see stale option lists.

function preCalculateConditionalOptions(
  quizId: string,
  allSteps: FormStep[],
  formAnswers: FormAnswers
) {
  const existingOptions = formAnswers._preCalculatedOptions;
  let hasValidOptions = false;

  if (existingOptions && typeof existingOptions === "object") {
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

  if (hasValidOptions) return;

  const preCalculatedOptions: Record<string, any> = {};

  allSteps.forEach((step) => {
    if (step.renderCondition && !step.renderCondition(formAnswers)) return;
    step.questions?.forEach((question: any) => {
      if (
        (question.type === "DROPDOWN" || question.type === "SINGLESELECT") &&
        typeof question.options === "function"
      ) {
        try {
          preCalculatedOptions[question.id] = question.options(formAnswers);
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

  Object.assign(formAnswers, { _preCalculatedOptions: preCalculatedOptions });

  if (process.client) {
    try {
      const currentData = localStorage.getItem(`quiz_${quizId}_data`);
      if (currentData) {
        const parsedData = JSON.parse(currentData);
        parsedData._preCalculatedOptions = preCalculatedOptions;
        localStorage.setItem(`quiz_${quizId}_data`, JSON.stringify(parsedData));
      }
    } catch (error) {
      console.warn("Failed to persist pre-calculated options:", error);
    }
  }
}

// ---------------------------------------------------------------------------
// Field dependencies
// ---------------------------------------------------------------------------
// When a parent field changes, clear its dependents. Quiz-agnostic; attached
// once per quiz inside `ensureQuizLoaded` to avoid stacking watchers across
// multiple `usePatientForm()` call sites.

const FIELD_DEPENDENCIES: Record<string, string[]> = {
  currentGlp1Type: [
    "lastDoseStrength",
    "lastDoseMonth",
    "lastDoseDay",
    "lastDoseYear",
  ],
};

// ---------------------------------------------------------------------------
// Idempotent quiz loader
// ---------------------------------------------------------------------------
// Safe to call any number of times — only does the actual work once per quiz
// id. Concurrent callers join the same in-flight promise. This is what kills
// the `StepLayout` "calling usePatientForm() snaps the step back" bug class.

async function ensureQuizLoaded(quizId: string): Promise<QuizState> {
  const state = ensureQuizState(quizId);
  // Both flags must be true AND the loaded `QuizConfig` must be present
  // in the module-level map. The map is process-local — on a freshly-
  // hydrated client `state.isInitialized` may already be `true` from the
  // SSR payload, but `loadedQuizConfigs` will be empty (the config has
  // function-typed fields and can't be in the SSR payload). Without the
  // `.has(quizId)` check here, the early-return short-circuits before the
  // config gets re-loaded into the client process, and `getQuizConfig()`
  // returns null forever — the form area renders empty even though
  // `state.isReady` is true.
  if (state.isInitialized && loadedQuizConfigs.has(quizId)) return state;
  const existing = inFlightInitPromises.get(quizId);
  if (existing) {
    await existing;
    return state;
  }

  const initPromise = (async () => {
    const quiz = await getQuizById(quizId);
    if (!quiz) return;

    // Stash the loaded config in a module-level map so the reactive
    // `useState` payload stays serializable (the config has function-typed
    // fields that devalue can't handle on SSR hydration).
    loadedQuizConfigs.set(quizId, quiz);

    // Build default answers
    const defaults: FormAnswers = {};
    quiz.steps
      .flatMap((step) => step.questions)
      .forEach((q) => {
        if (
          q.type === "CHECKBOX" &&
          "startValue" in q &&
          q.startValue === true &&
          q.options &&
          q.options.length > 0 &&
          q.options[0] !== undefined
        ) {
          defaults[q.id] = getOptionLabel(q.options[0]);
        } else {
          defaults[q.id] = q.type === "MULTISELECT" ? [] : null;
        }
      });
    Object.assign(state.defaultAnswers, defaults);

    // Initial answers (SSR-safe — `initializeFormData` returns a copy of
    // defaults; client-side persistence overlays on top below).
    const persistence = useFormPersistence(quizId);
    const { formAnswers: initialAnswers, startingStep } =
      persistence.initializeFormData(quiz.steps, defaults);
    Object.assign(state.answers, initialAnswers);
    state.stepIndex = startingStep;

    // Mirror the original timing: flip `isReady` before the async client
    // restoration so the page can begin rendering with defaults while we
    // hydrate from localStorage in the background.
    state.isReady = true;

    if (process.client) {
      const stepIndexRef = toRef(state, "stepIndex");
      persistence.setupAutoSave(state.answers, stepIndexRef);

      await nextTick();
      persistence.restoreClientState(
        quiz.steps,
        state.answers,
        stepIndexRef,
        (steps, answers) =>
          preCalculateConditionalOptions(quizId, steps, answers)
      );
      preCalculateConditionalOptions(quizId, quiz.steps, state.answers);
      state.lastCompletedStep = persistence.lastCompletedStep.value;
      await nextTick();

      const visible = quiz.steps.filter(
        (step) =>
          !step.renderCondition || step.renderCondition(state.answers)
      );
      if (state.stepIndex >= visible.length) {
        state.stepIndex = Math.max(0, visible.length - 1);
      }

      // If restored answers would trigger a per-step disqualification, land
      // the user one step before the disqualifying step so they have to pass
      // through it again.
      for (let i = 0; i < visible.length; i++) {
        const step = visible[i];
        if (
          step?.checkDisqualify &&
          step?.disqualifyCondition?.(state.answers) &&
          state.stepIndex > i
        ) {
          state.stepIndex = Math.max(0, i - 1);
          break;
        }
      }

      // Field-dependency watchers — once per quiz. Clearing a parent field
      // wipes its dependents and re-runs the conditional-option memoizer.
      if (!quizWatchersAttached.has(quizId)) {
        quizWatchersAttached.add(quizId);
        Object.entries(FIELD_DEPENDENCIES).forEach(
          ([parentField, dependentFields]) => {
            watch(
              () => state.answers[parentField],
              (newValue, oldValue) => {
                if (newValue !== oldValue && oldValue !== undefined) {
                  const parentValue = state.answers[parentField];
                  if (parentValue !== null && parentValue !== undefined) {
                    dependentFields.forEach((fieldId) => {
                      if (
                        state.answers[fieldId] !== null &&
                        state.answers[fieldId] !== undefined
                      ) {
                        state.answers[fieldId] = null;
                      }
                    });
                  }
                  preCalculateConditionalOptions(
                    quizId,
                    getQuizConfig(quizId)?.steps || [],
                    state.answers
                  );
                }
              }
            );
          }
        );
      }
    }

    state.isInitialized = true;
  })();

  inFlightInitPromises.set(quizId, initPromise);
  try {
    await initPromise;
  } finally {
    inFlightInitPromises.delete(quizId);
  }
  return state;
}

// ---------------------------------------------------------------------------
// Public composable
// ---------------------------------------------------------------------------

export function usePatientForm() {
  const route = useRoute();

  // Products catalog (DB-backed) — needed by the abandoned-lead block to
  // resolve a `productBundleId` from a product slug or variation UUID.
  // Reads from `useState('products-catalog')`, populated once per page load
  // by `plugins/02.products-catalog.ts`.
  const { products: productsCatalog } = useProductsCatalog();

  // Determine quiz ID based on productId or categoryId URL parameter.
  //
  // Resolution order:
  //   1. `?productId=<slug>` — resolved by the `resolve-product-quiz`
  //      route middleware (which runs before the page setup) and stashed
  //      in `useState('resolvedProductQuizId')`. The middleware hits
  //      `/api/products/[productId]`, which reads the `products` table
  //      for the current `org_id`. A null/missing resolution falls
  //      through to the default quiz.
  //   2. `?categoryId=<quizId>` — used directly as the quiz id. This path
  //      backs the consultation→checkout→consultation roundtrip when no
  //      productId is in the URL.
  //   3. Default quiz from `getDefaultQuizId()` (Supabase
  //      `default_quiz_id_override`, falling back to `data/common.json`).
  //
  // Note: variation-UUID lookup (where `productId` is a `variations[].id`)
  // is intentionally not handled here. Only the product slug resolves to a
  // quiz id; variation-UUID URLs fall through to the default quiz.
  const resolvedProductQuizId = useState<string | null>(
    "resolvedProductQuizId",
    () => null,
  );
  const selectedQuizId = computed(() => {
    const productId = route.query.productId as string;
    const categoryId = route.query.categoryId as string;

    if (productId) {
      return resolvedProductQuizId.value || getDefaultQuizId();
    }

    if (categoryId) {
      return categoryId;
    }

    return getDefaultQuizId();
  });

  // Bind to the active quiz's per-quiz state. The reference is captured at
  // call time and remains stable for the caller's lifetime — same contract
  // as the pre-refactor composable. Cross-quiz transitions in the app go
  // through a full page navigation, so each `/consultation` mount resolves
  // a fresh `state` for whichever quiz is in the URL.
  const state = ensureQuizState(selectedQuizId.value);

  // Idempotent — joins the existing init promise if another mount already
  // started it.
  //
  // SSR-skip is intentional: the loaded `QuizConfig` lives in a
  // module-level map that can't be transferred via the SSR payload, and
  // running the init on the server would race with `renderToString` —
  // sometimes finishing in time to flip `state.isReady` to true, sometimes
  // not, depending on how microtasks interleave with page rendering. When
  // the server captures `isReady = true` but the client process starts
  // with an empty `loadedQuizConfigs` map, the first client render shows
  // an empty form (no `selectedQuiz` config available yet) which doesn't
  // match the SSR-rendered form → "Hydration node mismatch" warning.
  //
  // Skipping on the server means SSR always captures the loading state
  // (`state.isReady = false`), the client matches it on first render, and
  // the async config load + re-render then proceeds without a mismatch.
  if (process.client) {
    ensureQuizLoaded(selectedQuizId.value);
  }

  // Re-hydrate when the URL quiz id changes within the same composable
  // instance. With the singleton registry, the new quiz gets its own
  // localStorage-restored state automatically; no answers leak across.
  watch(selectedQuizId, async (newQuizId, oldQuizId) => {
    if (newQuizId === oldQuizId) return;
    await ensureQuizLoaded(newQuizId);
    scrollToTop();
  });

  // --- DERIVED STATE ---
  const formAnswers = state.answers;
  const currentStepIndex = toRef(state, "stepIndex");
  const isQuizReady = toRef(state, "isReady");
  const lastCompletedStep = toRef(state, "lastCompletedStep");
  // The loaded `QuizConfig` lives in a module-level map (it contains
  // function-typed fields so it can't be in the reactive `useState`
  // payload). We use `state.isReady` as the reactivity trigger — it flips
  // to true at the end of `ensureQuizLoaded`, immediately after the config
  // is inserted into `loadedQuizConfigs`.
  const selectedQuiz = computed(() => {
    // Read `state.isReady` so this computed re-runs when init completes.
    return state.isReady ? getQuizConfig(selectedQuizId.value) : null;
  });
  const allStepsMaster = computed(() => selectedQuiz.value?.steps || []);
  const progressSteps = computed(
    () => selectedQuiz.value?.progressSteps || []
  );

  const submissionError = ref<string | null>(null);
  const isLoading = ref(false);
  const currentProgressMarker = ref(0);

  // --- DISQUALIFICATION STATE ---
  const isDisqualified = ref(false);
  const disqualifyMessage = ref<{
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
  }>({});
  const showReviewScreen = ref(false);
  const disqualifyingFields = ref<
    Array<{ fieldName: string; disqualifyingSelections: string[] }>
  >([]);
  const skipDisqualificationCheck = ref(false);

  // --- COMPUTED ---
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
    return interpolateFormStep(step, formAnswers);
  });

  const isLastStep = computed(
    () => currentStepIndex.value === visibleSteps.value.length - 1
  );

  // Step-completion delegate. We re-create the persistence binding on each
  // call so it always validates against the currently-active quiz id.
  const persistenceIsStepComplete = (step: FormStep) => {
    return useFormPersistence(selectedQuizId.value).isStepComplete(
      step,
      formAnswers
    );
  };

  const isEntireQuizComplete = computed(() => {
    return visibleSteps.value.every((step) => persistenceIsStepComplete(step));
  });

  const isStepComplete = computed(() => {
    if (!currentStepData.value) return false;
    if (!persistenceIsStepComplete(currentStepData.value)) return false;

    return currentStepData.value.questions.every((question: FormQuestion) => {
      if (question.type === "MARKETING" || question.type === "BEFORE_AFTER") {
        return true;
      }
      if (!question.required) return true;
      // Validation rules are checked inside `persistenceIsStepComplete`.
      return true;
    });
  });

  // --- SUBMISSION ---
  const finishQuiz = async () => {
    if (!skipDisqualificationCheck.value) {
      const disqualifications = checkForDisqualifyingConditions();
      if (disqualifications.length > 0) {
        pushDataLayer({ event: "USER_DISQUALIFIED" });
        disqualifyingFields.value = disqualifications;
        showReviewScreen.value = true;
        scrollToTop();
        return;
      }
    } else {
      skipDisqualificationCheck.value = false;
    }

    isLoading.value = true;

    try {
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

        // Customer.io: identify as lead and track quiz completion.
        const { convertObjectKeysToSnakeCase } = await import(
          "~/utils/camelToSnake"
        );
        const snakeCaseAttributes = convertObjectKeysToSnakeCase(formAnswers);
        customerio.completedQuiz(email, snakeCaseAttributes);
      } else {
        everflow.completeQuiz();
      }

      // Navigate to checkout, preserving productId or categoryId. When the
      // user landed on /consultation without a productId, forward the
      // resolved `selectedQuizId` as `categoryId` so /checkout knows which
      // quiz was completed.
      const productId = route.query.productId as string;
      const categoryId = route.query.categoryId as string;
      const queryParams: Record<string, string> = {};

      if (productId) {
        queryParams.productId = productId;
      } else {
        queryParams.categoryId =
          categoryId || selectedQuizId.value || getDefaultQuizId();
      }

      const trackingParams = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "promo",
        "affid",
        "oid",
        "uid",
        "affid2",
        "oid2",
        "uid2",
        "sub1",
        "sub2",
        "sub3",
        "sub4",
        "sub5",
        "source_id",
        "_ef_transaction_id",
      ];
      trackingParams.forEach((param) => {
        if (route.query[param]) {
          queryParams[param] = route.query[param] as string;
        }
      });

      // Fire abandoned-lead creation right before navigating to checkout so
      // a Lead case exists in CareValidate even if the user never completes
      // payment. Fire-and-forget — errors are logged but never block.
      //
      // Gated on `runtimeConfig.public.trackAbandonedLead` so projects that
      // don't want Lead cases (or don't have CareValidate wired up) can opt
      // out without touching this composable.
      const trackAbandonedLead =
        useRuntimeConfig().public?.trackAbandonedLead === true;
      if (email && trackAbandonedLead) {
        const UUID_RE =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let productBundleId: string | undefined;

        const queryBundleId = route.query.productBundleId as
          | string
          | undefined;
        if (queryBundleId && UUID_RE.test(queryBundleId)) {
          productBundleId = queryBundleId;
        } else if (productId) {
          // In site_template_form a variation `id` IS the productBundleId UUID.
          // Try the URL `productId` directly, else look up by product slug
          // and fall back to the monthly variation.
          if (UUID_RE.test(productId)) {
            productBundleId = productId;
          } else {
            for (const product of productsCatalog.value) {
              if (product.id === productId) {
                const monthly = product.variations.find(
                  (v) => v.duration === "monthly"
                );
                productBundleId =
                  monthly?.id ?? product.variations[0]?.id;
                break;
              }
              const match = product.variations.find(
                (v) => v.id === productId
              );
              if (match) {
                productBundleId = match.id;
                break;
              }
            }
          }
        }

        // Last-resort fallback: when the user landed via just `?categoryId=…`
        // (or via the default quiz with no params at all), there's no
        // product/variation in the URL. Pick the first product whose
        // `quizId` matches the resolved quiz and use its monthly (or first)
        // variation `id`.
        if (!productBundleId) {
          const targetQuizId = selectedQuizId.value;
          if (targetQuizId) {
            const productForQuiz = productsCatalog.value.find(
              (p) => p.quizId === targetQuizId
            );
            if (productForQuiz) {
              const monthly = productForQuiz.variations.find(
                (v) => v.duration === "monthly"
              );
              productBundleId =
                monthly?.id ?? productForQuiz.variations[0]?.id;
            }
          }
        }

        const answers = formAnswers as Record<string, any>;
        createAbandonedLead({
          email,
          firstName: String(answers.firstName ?? ""),
          lastName: String(answers.lastName ?? ""),
          weight: answers.weight != null ? String(answers.weight) : "",
          formTitle: getQuizConfig(selectedQuizId.value)?.name,
          formDescription: getQuizConfig(selectedQuizId.value)?.description,
          productBundleId,
        });
      }

      const queryString = new URLSearchParams(queryParams).toString();
      await navigateTo(`/checkout?${queryString}`);
    } catch (error) {
      submissionError.value = "Failed to complete form. Please try again.";
    } finally {
      isLoading.value = false;
    }
  };

  // --- NAVIGATION ---
  const nextStep = async () => {
    if (!isStepComplete.value) return;

    // Per-step disqualification check, fired immediately after steps with
    // `checkDisqualify`.
    const currentStep = visibleSteps.value[currentStepIndex.value];
    if (currentStep?.checkDisqualify && currentStep.disqualifyCondition) {
      if (currentStep.disqualifyCondition(formAnswers)) {
        disqualifyMessage.value = currentStep.disqualifyMessage || {};
        isDisqualified.value = true;
        pushDataLayer({ event: "USER_DISQUALIFIED" });
        scrollToTop();
        return;
      }
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
   * Configuration for disqualifying conditions per quiz type.
   * For weight-loss quiz: GLP-1 medications have specific contraindications.
   */
  const DISQUALIFICATION_CONFIG: Record<string, Record<string, string[]>> = {
    "weight-loss": {
      pregnancyStatus: [
        "Currently or possibly pregnant",
        "Breastfeeding or bottle-feeding with breastmilk",
      ],
      medicalConditions1: [
        "Type 1 diabetes",
        "Type 2 Diabetes (on insulin or sulfonylureas)",
      ],
      medicalConditions2: [
        "Gallbladder disease",
        "Cirrhosis or end-stage liver disease",
        "End-stage kidney disease (on or about to be on dialysis)",
        "History of or current pancreatitis",
        "Current suicidal thoughts or prior suicide attempt",
        "Diabetic retinopathy (diabetic eye disease), damage to the optic nerve from trauma or reduced blood flow, or blindness",
        "On blood thinners/warfarin",
        "Cancer (active diagnosis, active treatment, or in remission or cancer-free for less than 5 continuous years - does not apply to non-melanoma skin cancer that was considered cured via simple excision)",
      ],
    },
  };

  const checkForDisqualifyingConditions = (): Array<{
    fieldName: string;
    disqualifyingSelections: string[];
  }> => {
    const quizConfig = DISQUALIFICATION_CONFIG[selectedQuizId.value];
    if (!quizConfig) return [];

    const disqualifications: Array<{
      fieldName: string;
      disqualifyingSelections: string[];
    }> = [];

    Object.entries(quizConfig).forEach(([fieldName, disqualifyingOptions]) => {
      const userAnswer = formAnswers[fieldName];
      if (!userAnswer) return;

      if (Array.isArray(userAnswer)) {
        const selectedDisqualifyingOptions = userAnswer.filter(
          (selection: string) => disqualifyingOptions.includes(selection)
        );
        if (selectedDisqualifyingOptions.length > 0) {
          disqualifications.push({
            fieldName,
            disqualifyingSelections: selectedDisqualifyingOptions,
          });
        }
      } else if (typeof userAnswer === "string") {
        if (disqualifyingOptions.includes(userAnswer)) {
          disqualifications.push({
            fieldName,
            disqualifyingSelections: [userAnswer],
          });
        }
      }
    });

    return disqualifications;
  };

  const triggerDisqualificationReview = () => {
    const disqualifications = checkForDisqualifyingConditions();
    if (disqualifications.length > 0) {
      disqualifyingFields.value = disqualifications;
      showReviewScreen.value = true;
      scrollToTop();
    }
  };

  const confirmReviewedAnswers = () => {
    const disqualifications = checkForDisqualifyingConditions();
    if (disqualifications.length > 0) {
      pushDataLayer({ event: "USER_DISQUALIFIED" });
      isDisqualified.value = true;
      showReviewScreen.value = false;
      scrollToTop();
    } else {
      showReviewScreen.value = false;
      skipDisqualificationCheck.value = true;
      nextStep();
    }
  };

  const backFromReview = () => {
    showReviewScreen.value = false;
  };

  const backFromDisqualified = () => {
    isDisqualified.value = false;
    disqualifyMessage.value = {};
  };

  const resetDisqualificationState = () => {
    isDisqualified.value = false;
    disqualifyMessage.value = {};
    showReviewScreen.value = false;
    disqualifyingFields.value = [];
    skipDisqualificationCheck.value = false;
  };

  // --- WATCHERS ---

  // Keep the progress bar in sync with the current step.
  watch(
    currentStepIndex,
    (newIndex) => {
      const currentId = visibleSteps.value[newIndex]?.id;
      const quiz = selectedQuiz.value;
      if (!currentId || !quiz) return;
      const progressStepId = getProgressStepForFormStep(quiz, currentId);
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

  // Keep `currentStepIndex` valid when steps are conditionally hidden.
  watch(visibleSteps, (newVisibleSteps) => {
    if (currentStepIndex.value >= newVisibleSteps.length) {
      currentStepIndex.value = 0;
      scrollToTop();
    }
  });

  // --- UTILITY FUNCTIONS ---

  // Wrapper around `clearDependentFields` so callers can use it from outside
  // the composable. Operates on the *active* quiz's answers.
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

  const isQuizCompleted = (quizId: string): boolean => {
    if (!process.client) return false;
    return localStorage.getItem(`quiz_${quizId}_completed`) === "true";
  };

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

  const clearFormAndRestart = () => {
    if (window.confirm("Are you sure you want to restart the form?")) {
      const persistence = useFormPersistence(selectedQuizId.value);
      persistence.clearLocalStorage();
      // Reset in-memory state for the active quiz back to defaults.
      Object.keys(formAnswers).forEach((key) => {
        formAnswers[key] = Array.isArray(state.defaultAnswers[key]) ? [] : null;
      });
      currentStepIndex.value = 0;
      scrollToTop();
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
    fieldDependencies: FIELD_DEPENDENCIES,
    isQuizCompleted,
    getCompletedQuizIds,
    preCalculateConditionalOptions: (
      steps: FormStep[],
      answers: FormAnswers
    ) => preCalculateConditionalOptions(selectedQuizId.value, steps, answers),
    lastCompletedStep,
    currentProgressMarker,
    progressSteps,
    selectedQuiz,
    selectedQuizId,
    // Quiz completion
    isEntireQuizComplete,
    finishQuiz,
    // Disqualification exports
    isDisqualified,
    disqualifyMessage,
    showReviewScreen,
    disqualifyingFields,
    checkForDisqualifyingConditions,
    triggerDisqualificationReview,
    confirmReviewedAnswers,
    backFromReview,
    backFromDisqualified,
    resetDisqualificationState,
  };
}
