<template>
  <div class="flex flex-col items-center relative min-w-full px-4 lg:px-0">
    <!-- Full Screen Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-bodyColor bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="flex flex-col items-center space-y-4">
        <!-- Spinner -->
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accentColor1"></div>
        <!-- Loading text -->
        <p class="text-bodyColor font-medium text-lg">Processing...</p>
      </div>
    </div>

    <!-- Auto-Redirect Loading Overlay -->
    <div v-else-if="isAutoRedirecting" class="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <!-- Intentionally minimal to prevent flash -->
    </div>

    <!-- Quiz loading -->
    <div v-else-if="!isQuizReady" class="flex flex-col items-center justify-center py-24">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-accentColor1"></div>
    </div>

    <!-- DISQUALIFIED SCREEN -->
    <FormDisqualifiedScreen v-if="isDisqualified" />

    <!-- DISQUALIFICATION REVIEW SCREEN -->
    <FormDisqualificationReviewScreen 
      v-else-if="showReviewScreen"
      :disqualifying-fields="disqualifyingFields"
      :form-answers="formAnswers"
      :is-loading="isLoading"
      :selected-quiz="selectedQuizId"
      @continue="confirmReviewedAnswers"
      @back="backFromReview"
    />

    <!-- NORMAL FORM FLOW -->
    <template v-else>
      <!-- Progress Tracker (back button is rendered inside LayoutNavbar via
           `useNavbarBack`, wired below in the script). -->
      <div class="w-full max-w-[768px] mx-auto mb-0">
        <FormProgressTracker :steps="progressSteps" :currentStep="currentProgressMarker" />
      </div>

      <!-- Header with max-w-[668px] -->
      <div class="w-full max-w-[668px] mx-auto mb-0">
        <!-- 1. The Header Component -->
        <!-- It automatically displays the headings for the current step -->
        <Transition name="step-fade" mode="out-in">
          <FormHeader
            v-if="currentStepData"
            :key="currentStepData.id"
            :step-data="currentStepData"
          />
        </Transition>
      </div>

        <!-- Error Display -->
      <div v-if="submissionError" class="w-full max-w-[668px] mx-auto mb-6">
          <div class="border-2 border-red-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Form Error
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  {{ submissionError }}
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- Main Content Container with max-w-[668px] -->
      <div class="relative pb-32 lg:pb-12 w-full max-w-[668px] mx-auto">
        <Transition name="step-fade" mode="out-in">
          <FormStepLayout
            v-if="currentStepData"
            :key="currentStepData.id"
            :step-data="currentStepData"
            :form-answers="formAnswers"
            :is-loading="isLoading"
            class="mt-8"
            @auto-advance="handleAutoAdvance"
          />
        </Transition>

        <!-- Trust Badges (Mobile - below questions) -->
        <div v-if="currentStepData?.showTrustBadges" class="flex lg:hidden flex-col items-center gap-3 mt-6">
          <img src="/assets/images/icons/trustpilot.png" alt="Trustpilot" class="h-6 w-auto" />
          <img src="/assets/images/icons/hipaa.png" alt="HIPAA Compliant" class="h-24 w-auto" />
          <img src="/assets/images/icons/made-usa.jpg" alt="Made in USA" class="h-24 w-auto" />
        </div>

        <!-- 3. Navigation -->
        <div class="fixed bottom-8 left-0 right-0 px-4 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:px-0 w-full lg:mt-8 z-40">
          <div class="w-full max-w-[668px] mx-auto">

          <button @click="nextStep" :disabled="!isStepComplete || isLoading"
              :id="isLastQuestion ? 'finish-quiz' : (currentQuestionIndex === 0 ? 'begin-quiz' : undefined)"
              class="w-full text-base md:text-xl font-semibold h-12 md:h-14 rounded-full transition-colors flex items-center justify-center gap-2 shadow-lg lg:shadow-none"
            :class="isStepComplete && !isLoading ? 'bg-accentColor1 text-white hover:bg-accentColor1/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'">
            {{ isLoading ? 'Processing...' : (isLastQuestion ? 'Finish' : 'Next') }}
            <svg v-if="!isLoading" class="w-4 h-4" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15.2643 8.70829H1.79135C1.44898 8.70829 1.1618 8.59229 0.929804 8.36029C0.697804 8.12829 0.582206 7.84151 0.583012 7.49995C0.583012 7.15759 0.699012 6.87041 0.931012 6.63841C1.16301 6.40641 1.44979 6.29081 1.79135 6.29162H15.2643L11.8205 2.84787C11.5788 2.6062 11.4628 2.32426 11.4725 2.00204C11.4822 1.67981 11.5982 1.39787 11.8205 1.1562C12.0622 0.914536 12.3494 0.788466 12.6821 0.777994C13.0147 0.767522 13.3015 0.883522 13.5424 1.12599L19.0705 6.65412C19.1913 6.77495 19.2771 6.90586 19.3279 7.04683C19.3786 7.1878 19.4036 7.33884 19.4028 7.49995C19.4028 7.66106 19.3774 7.81211 19.3267 7.95308C19.2759 8.09405 19.1905 8.22495 19.0705 8.34579L13.5424 13.8739C13.3007 14.1156 13.0139 14.2316 12.6821 14.2219C12.3502 14.2122 12.063 14.0862 11.8205 13.8437C11.599 13.602 11.483 13.3201 11.4725 12.9979C11.462 12.6756 11.578 12.3937 11.8205 12.152L15.2643 8.70829Z"
                fill="currentColor" />
            </svg>
          </button>

            <!-- Trust Badges (Desktop - below button) -->
            <div v-if="currentStepData?.showTrustBadges" class="hidden lg:flex flex-col items-center gap-3 mt-6">
              <img src="/assets/images/icons/trustpilot.png" alt="Trustpilot" class="h-6 w-auto" />
              <img src="/assets/images/icons/hipaa.png" alt="HIPAA Compliant" class="h-24 w-auto" />
              <img src="/assets/images/icons/made-usa.jpg" alt="Made in USA" class="h-24 w-auto" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePatientForm } from "~/composables/usePatientForm";
import { onMounted, onBeforeUnmount, ref, watchEffect } from "vue";
import { useEverflow } from "~/composables/useEverflow";
import { scrollToTop } from "~/utils/scrollToTop";
import { pushDataLayer } from "~/utils/dataLayer";
import { useNavbarBack } from "~/composables/useNavbarBack";
definePageMeta({ layout: "consultation" });

const route = useRoute();
const router = useRouter();
const everflow = useEverflow();
const nuxtApp = useNuxtApp();

// Loading state for auto-redirect to checkout
const isAutoRedirecting = ref(false);
// Get form state from composable
const {
  currentQuestionIndex,
  formAnswers,
  currentStepData,
  isLastQuestion,
  isStepComplete,
  isLoading,
  isQuizReady,
  submissionError,
  currentProgressMarker,
  progressSteps,
  nextStep: originalNextStep,
  prevStep: originalPrevStep,
  clearFormAndRestart,
  selectedQuizId,
  // Quiz completion
  isEntireQuizComplete,
  finishQuiz,
  // Disqualification state and functions
  isDisqualified,
  showReviewScreen,
  disqualifyingFields,
  confirmReviewedAnswers,
  backFromReview,
} = usePatientForm();

// Build a `click_continue` payload for the step the user is currently on.
// Fired on every forward-progression (Next button or auto-advance).
const buildClickContinuePayload = () => {
  const step = currentStepData.value;
  const questionIds = step?.questions?.map((q: any) => q.id) || [];
  const answersForStep: Record<string, unknown> = {};
  questionIds.forEach((id: string) => {
    answersForStep[id] = formAnswers[id];
  });

  return {
    event: 'click_continue',
    form_progress: (currentQuestionIndex.value ?? 0) + 1,
    total_steps: progressSteps.value?.length || 0,
    form_question: step?.id || null,
    form_answers: answersForStep,
  };
};

// Wrapper around nextStep to fire GTM events and scroll to top
const nextStep = async () => {
  // Fire `click_continue` for every forward click in the quiz (before advancing
  // so the payload reflects the step the user just completed).
  if (isStepComplete.value) {
    pushDataLayer(buildClickContinuePayload());
  }

  // If this is the last question and step is complete, fire QUIZ_FINISH event
  if (isLastQuestion.value && isStepComplete.value) {
    pushDataLayer({ event: 'QUIZ_FINISH' });

    // Google Analytics: Track Lead Generation (Quiz Completion)
    if (nuxtApp.$ga4) {
      nuxtApp.$ga4.trackLead();
    }
  }

  // Call the original nextStep function
  await originalNextStep();
  
  // Scroll to top smoothly after step changes
  scrollToTop();
};

// Wrapper around prevStep to scroll to top
const prevStep = () => {
  originalPrevStep();
  
  // Scroll to top smoothly after step changes
  scrollToTop();
};

// Wire the navbar's back button to the right action for the current state:
//   - Disqualified final screen → no back button
//   - Disqualification review screen → `backFromReview` (review's own handler)
//   - Normal quiz flow past the first question → `prevStep`
//   - First question → no back button (nothing to go back to in-quiz)
const { setBack, clearBack } = useNavbarBack();
watchEffect(() => {
  if (isDisqualified.value) {
    clearBack();
  } else if (showReviewScreen.value) {
    setBack(() => backFromReview(), "Back to quiz");
  } else if ((currentQuestionIndex.value ?? 0) > 0 && !isLoading.value) {
    setBack(() => prevStep(), "Previous question");
  } else {
    clearBack();
  }
});
onBeforeUnmount(() => {
  clearBack();
});

// Function to clear form and restart (goes back to same quiz)
const handleClearFormAndRestart = () => {
  // Call the composable's clearFormAndRestart function
  clearFormAndRestart();
};

// Handle auto-advance from form inputs
const handleAutoAdvance = async () => {
  if (!isStepComplete.value) return;

  // If ALL visible quiz steps are complete, skip straight to checkout
  if (isEntireQuizComplete.value) {
    // Auto-advance counts as a "continue" for the step the user just answered
    pushDataLayer(buildClickContinuePayload());
    pushDataLayer({ event: 'QUIZ_FINISH' });
    if (nuxtApp.$ga4) {
      nuxtApp.$ga4.trackLead();
    }
    await finishQuiz();
    return;
  }

  // Otherwise just advance to the next step (nextStep handles click_continue)
  nextStep();
};

// Function to check if quiz is completed and redirect to checkout
const checkQuizCompletionAndRedirect = async (): Promise<boolean> => {
  if (!process.client) return false;

  const categoryId = route.query.categoryId as string;
  const productId = route.query.productId as string;
  
  let quizId = categoryId || selectedQuizId.value || 'weight-loss';
  
  const completionKey = `quiz_${quizId}_completed`;
  const dataKey = `quiz_${quizId}_data`;
  
  const isCompleted = localStorage.getItem(completionKey) === 'true';
  const hasFormData = !!localStorage.getItem(dataKey);
  
  if (isCompleted && hasFormData) {
    isAutoRedirecting.value = true;
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const checkoutQuery: any = {};
    
    if (productId) {
      checkoutQuery.productId = productId;
    }

    if (categoryId) {
      checkoutQuery.categoryId = categoryId;
    } else {
      checkoutQuery.categoryId = quizId;
    }

    // Preserve UTM parameters and promo code
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'promo'];
    utmParams.forEach(param => {
      if (route.query[param]) {
        checkoutQuery[param] = route.query[param];
      }
    });
    
    await router.push({
      path: '/checkout',
      query: checkoutQuery
    });
    
    return true;
  }
  
  return false;
};

onMounted(async () => {
  const redirected = await checkQuizCompletionAndRedirect();
  
  if (redirected) {
    return;
  }

  pushDataLayer({ event: 'QUIZ_START' });

  everflow.beginQuiz();
  everflow.productSelected();
});
</script>

<style scoped>
/* Fade transition between quiz steps. `mode="out-in"` on the <Transition>
   makes the current step fade to 0 before the next one fades in from 0. */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 180ms ease;
}

.step-fade-enter-from,
.step-fade-leave-to {
  opacity: 0;
}
</style>
