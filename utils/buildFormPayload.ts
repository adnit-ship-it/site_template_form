import type { FormAnswers, FormStep } from "~/types/form";
import { convertFileToBase64 } from "~/utils/convertFile";
import { convertToInternationalFormat } from "~/utils/validation";
import { getQuizById } from "~/data/quizConfigs";
import { calculateMedicalValues } from "~/utils/calculations";

export interface PaymentInfo {
  paymentDescription?: string;
  paymentAmount?: number;
  shippingAddress?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  stripeSetupId?: string;
  stripePaymentIntentId?: string;
  paymentDate?: string;
  validUntil?: string;
  status?: string;
  promoCode?: string;
}

interface QuestionPayload {
  question: string;
  answer: any;
  type: string;
  options?: any[];
  required?: boolean;
}

/**
 * Builds the questions array from form steps + answers for the API payload.
 */
async function buildQuestionsPayload(
  steps: FormStep[],
  formAnswers: FormAnswers,
  productBundleId?: string,
  paymentInfo?: PaymentInfo
): Promise<QuestionPayload[]> {
  const questionsPayload: QuestionPayload[] = [];

  // Bundle medication questions (GLP + NAD)
  if (formAnswers.bundleGLP && formAnswers.bundleNAD) {
    const isB12Bundle = productBundleId === '632a77ed-939e-438e-b57b-1c7e39cebf32';
    questionsPayload.push(
      {
        question: isB12Bundle ? "Selected B12 Treatment" : "Selected GLP-1 Medication",
        answer: formAnswers.bundleGLP,
        type: "SINGLESELECT",
        required: true,
      },
      {
        question: "Selected NAD+ Treatment",
        answer: formAnswers.bundleNAD,
        type: "SINGLESELECT",
        required: true,
      }
    );
  }

  for (const step of steps) {
    for (const question of step.questions) {
      if (
        question.type === "MARKETING" ||
        question.type === "BEFORE_AFTER" ||
        question.type === "MEDICAL_REVIEW" ||
        !("apiType" in question)
      )
        continue;

      const answer = formAnswers[question.id];
      if (answer === null || answer === undefined || answer === "") continue;

      const entry: QuestionPayload = {
        question: question.question || `Question ${question.id}`,
        answer,
        type: "apiType" in question ? question.apiType : "TEXT",
      };

      // File handling
      if (entry.type === "FILE" && answer instanceof File) {
        const base64Data = await convertFileToBase64(answer);
        entry.answer = [{ name: answer.name, contentType: answer.type, data: base64Data }];
      } else if (
        entry.type === "FILE" &&
        typeof answer === "object" &&
        answer.name && answer.contentType && answer.data
      ) {
        entry.answer = [{ name: answer.name, contentType: answer.contentType, data: answer.data }];
      }

      // Ensure question text is never empty
      if (!entry.question || entry.question.trim() === "") {
        entry.question = `Question ${question.id}`;
      }

      // Format answer by type
      if (entry.type === "FILE") {
        // already handled
      } else if (entry.type === "SINGLESELECT") {
        entry.answer = Array.isArray(answer) ? answer[0] : answer;
      } else if (entry.type === "MULTISELECT") {
        entry.answer = Array.isArray(answer) ? answer : [answer];
      } else {
        if (Array.isArray(answer)) {
          entry.answer = answer.map((item: any) => typeof item === "string" ? item : String(item));
        } else {
          entry.answer = typeof answer === "string" ? answer : String(answer);
        }
      }

      // Attach option labels
      if (
        "options" in question &&
        question.options &&
        Array.isArray(question.options) &&
        question.options.length > 0
      ) {
        entry.options = question.options.map((option) =>
          typeof option === "object" && option !== null && "label" in option
            ? option.label
            : String(option)
        );
      }

      if (question.required) {
        entry.required = true;
      }

      questionsPayload.push(entry);
    }
  }

  // BMI
  try {
    const medicalValues = calculateMedicalValues(formAnswers);
    if (medicalValues.bmi && medicalValues.bmi !== "0.00") {
      questionsPayload.push({ question: "BMI", answer: medicalValues.bmi, type: "TEXT" });
    }
  } catch {
    console.warn("Failed to calculate BMI for question payload");
  }

  // Consultation Type based on shipping state
  {
    const restrictedAbbrevs = new Set(["NM", "MS", "KS", "WV", "RI"]);
    const restrictedFullNames = new Set(["New Mexico", "Mississippi", "Kansas", "West Virginia", "Rhode Island"]);
    const stateFromPayment = paymentInfo?.shippingAddress?.state;
    const stateFromForm = formAnswers.shippingState as string | undefined;
    const needsSync =
      (stateFromPayment && restrictedAbbrevs.has(stateFromPayment)) ||
      (stateFromForm && restrictedFullNames.has(stateFromForm));
    questionsPayload.push({
      question: "Consultation Type",
      answer: needsSync ? "SYNC_VIDEO" : "ASYNC_TEXT_EMAIL",
      type: "WIDGET_VISIT_TYPE",
    });
  }

  return questionsPayload;
}


/**
 * Resolves the Stripe ID (SetupIntent or PaymentIntent) from the various sources,
 * validates it, and returns the final ID.
 */
function resolveStripeId(
  formAnswers: FormAnswers,
  paymentInfo?: PaymentInfo
): string | undefined {
  const stripePaymentData = formAnswers.stripePayment;
  let stripeId = stripePaymentData?.stripeSetupId;

  if (paymentInfo?.stripeSetupId) stripeId = paymentInfo.stripeSetupId;
  if (paymentInfo?.stripePaymentIntentId) stripeId = paymentInfo.stripePaymentIntentId;

  if (!stripeId || stripeId === "ready") return stripeId;

  const isSetupIntent = stripeId.startsWith("seti_");
  const isPaymentIntent = stripeId.startsWith("pi_");

  if (stripeId === "your-stripe-setup-id" || (!isSetupIntent && !isPaymentIntent)) {
    throw new Error("Valid payment setup is required. Please complete the payment step.");
  }

  if (stripeId.includes("!") || stripeId.includes(" ")) {
    throw new Error("Invalid payment ID format. Please complete the payment step again.");
  }

  return stripeId;
}

/**
 * Resolves and validates the shipping address from paymentInfo or formAnswers.
 */
function resolveShippingAddress(formAnswers: FormAnswers, paymentInfo?: PaymentInfo) {
  const stripePaymentData = formAnswers.stripePayment;
  let address = paymentInfo?.shippingAddress;

  if (!address && stripePaymentData?.shippingAddress) {
    address = stripePaymentData.shippingAddress;
  }

  if (!address || !address.addressLine1 || !address.city || !address.state || !address.postalCode) {
    throw new Error("Please complete your shipping address information.");
  }

  return {
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
}

/**
 * Builds the complete API payload for form submission.
 * This is the single source of truth for payload assembly.
 */
export async function buildFormPayload(
  formAnswers: FormAnswers,
  steps: FormStep[],
  config: any,
  paymentInfo?: PaymentInfo,
  quizId?: string,
  productBundleId?: string
) {
  const questionsPayload = await buildQuestionsPayload(steps, formAnswers, productBundleId, paymentInfo);

  const dob =
    formAnswers.dobYear && formAnswers.dobMonth && formAnswers.dobDay
      ? `${formAnswers.dobYear}-${String(formAnswers.dobMonth).padStart(2, "0")}-${String(formAnswers.dobDay).padStart(2, "0")}`
      : "";

  const finalStripeId = resolveStripeId(formAnswers, paymentInfo);

  // Handle "ready" stripeId — caller must have already confirmed setup
  if (finalStripeId === "ready") {
    try {
      const { useStripe } = await import("~/composables/useStripe");
      const { clientSecret } = useStripe();
      if (!clientSecret.value) {
        throw new Error("Payment setup not initialized. Please refresh and try again.");
      }
    } catch {
      throw new Error("Failed to confirm payment setup. Please try again.");
    }
  }

  const shippingAddress = resolveShippingAddress(formAnswers, paymentInfo);

  const payload: any = {
    firstName: formAnswers.firstName ?? "",
    lastName: `${formAnswers.lastName ?? ""}${config.public.isDevelopment ? ' Test' : ''}`,
    email: formAnswers.email ?? "",
    phoneNumber: convertToInternationalFormat(formAnswers.phone ?? "") ?? "",
    dob,
    gender: formAnswers.gender ?? "",
    paymentDescription: paymentInfo?.paymentDescription ?? "Personalized GLP-1 Medication Program",
    paymentAmount: paymentInfo?.paymentAmount ?? 0.5,
    shippingAddress,
    formTitle: (await getQuizById(quizId || 'weight-loss'))?.name || 'Medical Intake Form',
    formDescription: (await getQuizById(quizId || 'weight-loss'))?.description || 'Patient medical intake form',
    ...(config.public.isProduction && { productBundleId: productBundleId || '' }),
    questions: questionsPayload,
    promoCodes: paymentInfo?.promoCode && paymentInfo.promoCode.trim()
      ? { Promo: paymentInfo.promoCode.trim() }
      : {},
  };

  // Attach the correct Stripe ID field
  if (finalStripeId && finalStripeId !== "ready") {
    if (finalStripeId.startsWith("pi_")) {
      payload.stripePaymentIntentId = finalStripeId;
    } else if (finalStripeId.startsWith("seti_")) {
      payload.stripeSetupId = finalStripeId;
    }
  }

  // Validate required fields
  const missingFields: string[] = [];
  if (!payload.firstName) missingFields.push("firstName");
  if (!payload.lastName) missingFields.push("lastName");
  if (!payload.email) missingFields.push("email");
  if (!payload.phoneNumber) missingFields.push("phoneNumber");
  if (!payload.dob) missingFields.push("dob");
  if (!payload.gender) missingFields.push("gender");

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  return { payload, finalStripeId };
}
