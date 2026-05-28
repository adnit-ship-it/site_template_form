import { type Ref } from "vue";
import type { FormAnswers, FormStep } from "~/types/form";
import { useEverflow } from "~/composables/useEverflow";
import { useCustomerio } from "~/composables/useCustomerio";
import { buildFormPayload, type PaymentInfo } from "~/utils/buildFormPayload";
import { buildFormPayloadNew } from "~/utils/buildFormPayloadNew";
import { getDefaultQuizId } from "~/data/quizConfigs";

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
 *
 * Bundle-id naming reflects the dual identifier model on `ProductVariation`:
 *   - `productBundleId` = variation `id` (local UUID). Drives the NEW API
 *     builder, downstream tracking, and URL parameters.
 *   - `legacyBundleId`  = variation `bundleId` (upstream pharmacy UUID).
 *     Sent only to the LEGACY API builder, where it populates the
 *     `productBundleId` field on the wire payload.
 *
 * Callers that don't have a separate `bundleId` (e.g. older code paths) can
 * omit `legacyBundleId`; the legacy builder will then receive `undefined`
 * and emit no `productBundleId` field.
 */
export async function submitPatientForm(
  formAnswers: FormAnswers,
  allStepsMaster: Ref<FormStep[]>,
  config: any,
  submissionError: Ref<string | null>,
  isLoading?: Ref<boolean>,
  paymentInfo?: PaymentInfo,
  quizId?: string,
  productBundleId?: string,
  legacyBundleId?: string
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

    // `useNewAPI` moved to Supabase (`site_config.use_new_api`). The
    // composable reads from the same `useState` slot the runtime-config-db
    // plugin populated at app init — works in utility functions because
    // they're called from Nuxt request scope (event handlers / Vue setup).
    const useNewAPI = useRuntimeConfigDB().value.siteConfig.useNewAPI;

    // NMI Collect.js token (useStripe = false). Falls back to a token stashed
    // on form answers for older/BNPL-restore code paths. When present, it
    // replaces the Stripe reference in whichever builder runs.
    const nmiPaymentToken =
      paymentInfo?.nmiPaymentToken ||
      (formAnswers as any).nmiPayment?.nmiPaymentToken ||
      undefined;

    let payload: any;
    let finalStripeId: string | undefined;

    if (useNewAPI) {
      const stripePaymentData = formAnswers.stripePayment;
      finalStripeId = nmiPaymentToken
        ? undefined
        : (paymentInfo?.stripeSetupId
          || paymentInfo?.stripePaymentIntentId
          || stripePaymentData?.stripeSetupId
          || undefined);

      const shippingAddress = paymentInfo?.shippingAddress
        || stripePaymentData?.shippingAddress
        || { addressLine1: "", city: "", state: "", postalCode: "", country: "US" };

      payload = await buildFormPayloadNew(
        allStepsMaster.value,
        formAnswers,
        // Pass "" when NMI so the builder skips the Stripe providerReference
        // branch and uses paymentInfo.nmiPaymentToken instead.
        nmiPaymentToken ? "" : (finalStripeId || ""),
        shippingAddress,
        paymentInfo,
        config,
        quizId,
        productBundleId
      );
    } else {
      // Legacy API: send the upstream pharmacy bundle id (variation.bundleId).
      // Falls back to productBundleId (variation.id) when callers don't yet
      // pass the new field — preserves behavior for in-flight BNPL sessions.
      const result = await buildFormPayload(
        formAnswers,
        allStepsMaster.value,
        config,
        paymentInfo,
        quizId,
        legacyBundleId ?? productBundleId
      );
      payload = result.payload;
      finalStripeId = result.finalStripeId;
    }

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

    // Email lives at different paths depending on which builder ran:
    //   legacy (`/dynamic-case`)    → `payload.email`
    //   new    (`/cases`)           → `payload.user.email`
    // Resolve once and reuse below so post-submission tracking works for both.
    const submittedEmail = (
      payload?.user?.email ||
      payload?.email ||
      formAnswers.email ||
      ""
    ).trim();

    if (response.data?.data?.caseId) {
      toast.success("Form submitted successfully!");

      everflow.conversion({
        email: submittedEmail,
        order_id: finalStripeId || nmiPaymentToken || response.data?.data?.caseId || "",
        amount: paymentInfo?.paymentAmount ?? 0.5,
        case_id: response.data?.data?.caseId || "",
      }).catch((err) => {
        console.warn('Everflow conversion failed (non-critical):', err);
      });

      customerio.completedPurchase(
        submittedEmail,
        finalStripeId || nmiPaymentToken || response.data?.data?.caseId || "",
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
    const resolvedQuizId = quizId || getDefaultQuizId();
    const { useFormPersistence } = await import("~/composables/useFormPersistence");
    const { clearLocalStorage } = useFormPersistence(resolvedQuizId);
    clearLocalStorage();

    // Drop the in-memory singleton entry for this quiz so a subsequent
    // visit to /consultation starts from a clean slate (matching the now-
    // cleared localStorage). The legacy `useState("currentStepIndex")`
    // bucket was previously zeroed here; it no longer exists post-refactor.
    const { resetQuizState } = await import("~/composables/usePatientForm");
    resetQuizState(resolvedQuizId);

    // `currentFormStep` is a separate state bucket owned by `useFormState.ts`
    // (used by `layouts/default.vue` for the legacy progress UI). Keep this
    // reset until that system is folded into `usePatientForm`.
    const currentFormStep = useState("currentFormStep", () => 0);
    currentFormStep.value = 0;

    // Redirect to welcome page after brief delay
    setTimeout(async () => {
      const email = formAnswers.email || submittedEmail || '';
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
        await navigateTo({ path: '/confirmation', query: welcomeQuery });
      } catch (navError) {
        console.warn('[submitPatientForm] navigateTo failed, using window.location:', navError);
        const qs = new URLSearchParams(welcomeQuery as Record<string, string>).toString();
        window.location.href = `/confirmation${qs ? `?${qs}` : ''}`;
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
