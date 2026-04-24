import { type Ref } from "vue";
import type { FormAnswers, FormStep } from "~/types/form";
import { useEverflow } from "~/composables/useEverflow";
import { useCustomerio } from "~/composables/useCustomerio";
import { buildFormPayload, type PaymentInfo } from "~/utils/buildFormPayload";

type ApiResponse = {
  success: boolean;
  data: {
    data: {
      caseId: string;
      formResponseId?: string;
    };
  };
};

/**
 * Handles the form submission logic.
 */
export async function submitPatientForm(
  formAnswers: FormAnswers,
  allStepsMaster: Ref<FormStep[]>,
  config: any,
  submissionError: Ref<string | null>,
  isLoading?: Ref<boolean>,
  paymentInfo?: PaymentInfo,
  quizId?: string,
  productBundleId?: string
) {
  submissionError.value = null;
  const everflow = useEverflow();
  const customerio = useCustomerio();

  const email = (formAnswers.email || "").trim();
  if (email && paymentInfo?.paymentAmount) {
    customerio.initiatedCheckout(email, paymentInfo.paymentAmount);
  }

  try {
    // Restore universal ID upload from localStorage if missing
    if (!formAnswers.idUploadUniversal && process.client) {
      try {
        const universalIdUpload = localStorage.getItem('universal_id_upload');
        if (universalIdUpload) {
          formAnswers.idUploadUniversal = JSON.parse(universalIdUpload);
        }
      } catch (error) {
        console.warn('Failed to load universal ID upload:', error);
      }
    }

    // Build the full API payload (questions, address, Stripe ID, validation — all in one place)
    const { payload, finalStripeId } = await buildFormPayload(
      formAnswers,
      allStepsMaster.value,
      config,
      paymentInfo,
      quizId,
      productBundleId
    );

    // Submit to the API
    let response: ApiResponse;
    try {
      response = await $fetch<ApiResponse>("/api/submit-form", {
        method: "POST",
        body: payload,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (apiError: any) {
      const errorMessage = apiError.data?.data?.error || '';
      const errorStr = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
      const isCardDeclined = errorStr.includes('requires_action') ||
        errorStr.includes('insufficient funds') ||
        errorStr.includes('card was declined') ||
        errorStr.includes('exceeding its amount limit');

      if (!isCardDeclined && errorStr) {
        const { useToast } = await import('vue-toastification');
        const toast = useToast();
        toast.error(errorStr);
      }

      throw apiError;
    }

    // Success handling
    const { useToast } = await import("vue-toastification");
    const toast = useToast();

    if (response.data?.data?.caseId) {
      toast.success("Form submitted successfully!");

      everflow.caseCreated({
        email: (payload.email || "").trim(),
        order_id: finalStripeId || response.data?.data?.caseId || "",
        amount: paymentInfo?.paymentAmount ?? 0.5,
        case_id: response.data?.data?.caseId || "",
      }).catch((err) => {
        console.warn('Everflow caseCreated failed (non-critical):', err);
      });

      customerio.completedPurchase(
        (payload.email || "").trim(),
        finalStripeId || response.data?.data?.caseId || "",
        paymentInfo?.paymentAmount ?? 0.5,
        response.data?.data?.caseId || ""
      );
    } else {
      toast.success("Form submitted successfully!");
    }

    if (isLoading) {
      isLoading.value = false;
    }

    // Reset form persistence and shared state
    const { useFormPersistence } = await import("~/composables/useFormPersistence");
    const { clearLocalStorage } = useFormPersistence(quizId || 'weight-loss');
    clearLocalStorage();

    const currentStepIndex = useState("currentStepIndex", () => 0);
    const currentFormStep = useState("currentFormStep", () => 0);
    currentStepIndex.value = 0;
    currentFormStep.value = 0;

    // Redirect to welcome page after brief delay
    setTimeout(async () => {
      const email = formAnswers.email || payload.email || '';
      const caseId = response.data?.data?.caseId || '';

      const restrictedStates = ['NM', 'MS', 'KS', 'WV', 'RI'];
      const shippingState = paymentInfo?.shippingAddress?.state;
      const needsSync = shippingState && restrictedStates.includes(shippingState);

      const welcomeQuery: Record<string, string> = {
        email,
        confirmation: caseId,
      };

      if (quizId) welcomeQuery.categoryId = quizId;
      if (needsSync) welcomeQuery.showSync = 'true';

      // GA4 purchase tracking (fire and forget)
      if (typeof window !== 'undefined') {
        const nuxtApp = useNuxtApp();
        const paymentAmount = paymentInfo?.paymentAmount || 0;
        const caseId = response.data?.data?.caseId || '';

        const ga4 = nuxtApp.$ga4 as Record<string, Function> | undefined;
        if (ga4?.trackPurchase && caseId) {
          ga4.trackPurchase(caseId, paymentAmount, 'USD', [{
            item_id: productBundleId || 'unknown',
            item_name: paymentInfo?.paymentDescription || 'Weight Loss Program',
            price: paymentAmount,
            quantity: 1,
          }]);
        }
      }

      try {
        await navigateTo({ path: '/welcome', query: welcomeQuery });
      } catch (navError) {
        console.warn('[submitPatientForm] navigateTo failed, using window.location:', navError);
        const qs = new URLSearchParams(welcomeQuery as Record<string, string>).toString();
        window.location.href = `/welcome${qs ? `?${qs}` : ''}`;
      }
    }, 400);

    return response;
  } catch (error: any) {
    if (isLoading) {
      isLoading.value = false;
    }

    const cardDeclineMessage = error.data?.data?.error || '';
    const cardDeclineStr = typeof cardDeclineMessage === 'string' ? cardDeclineMessage : JSON.stringify(cardDeclineMessage);
    const isCardDecline = cardDeclineStr.includes('requires_action') ||
      cardDeclineStr.includes('insufficient funds') ||
      cardDeclineStr.includes('card was declined') ||
      cardDeclineStr.includes('exceeding its amount limit');

    let errorMessage = error.message || "Something went wrong. Please try again.";
    if (error.statusCode === 409) {
      errorMessage = "Please use a unique email and phone number";
    } else if (error.statusCode === 500) {
      errorMessage = "Something went wrong. Try again later.";
    }

    if (!isCardDecline) {
      submissionError.value = errorMessage;
      const { useToast } = await import("vue-toastification");
      const toast = useToast();
      toast.error(errorMessage);
    }

    const failedEmail = (formAnswers.email || "").trim();
    if (failedEmail && paymentInfo?.paymentAmount) {
      customerio.failedPurchase(failedEmail, paymentInfo.paymentAmount, errorMessage);
    }

    throw error;
  }
}
