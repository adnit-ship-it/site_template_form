import type { FormAnswers, FormStep } from "~/types/form";
import { getOptionLabel } from "~/types/form";
import { convertToInternationalFormat } from "~/utils/validation";
import { calculateMedicalValues } from "~/utils/calculations";
import { getQuizById } from "~/data/quizConfigs";

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
  // NMI Collect.js single-use token. When set (useStripe = false), it replaces
  // the Stripe `providerReference` in the `payment` block.
  nmiPaymentToken?: string;
  promoCode?: string;
  // Subscription plan key chosen by the user. Mapped to interval/intervalCount
  // by `planToSubscription`. Currently supported: "monthly" | "threeMonthly" |
  // "sixMonthly" | "yearly". Anything else (or unset) defaults to monthly.
  plan?: string;
}

interface CleanShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface UserBlock {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  phoneNumber: string;
  dob: string;
  languagePreferences: string[];
  shippingAddress: CleanShippingAddress;
}

interface ProductBlock {
  id: string;
  subscription: { interval: string; intervalCount: number };
  form?: {
    title: string;
    description: string;
    questions: any[];
  };
}

interface PaymentBlock {
  amount: number;
  currency: string;
  description: string;
  // Stripe reference. Optional because the NMI path uses `nmiPaymentToken`
  // instead (the two are mutually exclusive).
  providerReference?: {
    type: "PAYMENT_INTENT" | "SETUP_INTENT";
    id: string;
  };
  // NMI Collect.js single-use token (useStripe = false).
  nmiPaymentToken?: string;
}

/**
 * Wire-shape consumed by Care Validate's `/v1/cases` endpoint. The user fields
 * are wrapped under `user`, the intake form is nested inside `products[].form`,
 * and the Stripe reference lives in `payment.providerReference`. This is
 * intentionally different from the flat legacy `/v1/dynamic-case` payload
 * built by `utils/buildFormPayload.ts`.
 */
interface FormPayload {
  isTest: boolean;
  forceCreate: boolean;
  user: UserBlock;
  products: ProductBlock[];
  payment?: PaymentBlock;
}

/**
 * Maps a UI plan key to a Care Validate `subscription` block. Unknown / unset
 * plans collapse to the monthly default — matches the upstream reference
 * implementation and the legacy single-product fallback.
 */
function planToSubscription(
  plan: string | null | undefined,
): { interval: string; intervalCount: number } {
  switch (plan) {
    case "threeMonthly":
      return { interval: "month", intervalCount: 3 };
    case "sixMonthly":
      return { interval: "month", intervalCount: 6 };
    case "yearly":
      return { interval: "year", intervalCount: 1 };
    default:
      return { interval: "month", intervalCount: 1 };
  }
}

// "None of the above"-style answers. When a MULTISELECT contains ONLY these
// (and nothing else), it gets collapsed into a SINGLESELECT carrying just the
// sentinel — this keeps downstream analytics from treating "None" as an array
// with one item, and aligns the new-API payload with the legacy builder.
const NONE_SENTINELS = new Set([
  "none",
  "none of the above",
  "none of these",
  "none of these above",
]);
const isSentinel = (v: string) => NONE_SENTINELS.has(v.toLowerCase().trim());

/**
 * Assembles the questions payload array for API submission.
 *
 * Mirrors the question-building logic in `utils/submitPatientForm.ts` (the
 * reference implementation):
 *   - Prepends bundled-medication questions when `bundleGLP` + `bundleNAD`
 *     are both present (B12 vs GLP-1 label decided by `productBundleId`).
 *   - Skips MARKETING / BEFORE_AFTER / MEDICAL_REVIEW / PRODUCTSELECT and any
 *     question without an `apiType`.
 *   - Skips null / undefined / "" / `[]` answers.
 *   - MULTISELECT: collapses to SINGLESELECT when only sentinel ("None of the
 *     above") values were selected, otherwise JSON-stringifies the real
 *     selections. Sentinels are filtered out of the `options` array, and
 *     re-appended only in the collapse case.
 *   - Options are ONLY emitted for MULTISELECT questions.
 *   - TEXT answers that arrive as arrays are joined with ", ".
 *   - Appends BMI (when calculable) and Consultation Type (SYNC_VIDEO for
 *     restricted states, ASYNC_TEXT_EMAIL otherwise) at the end.
 */
export async function buildQuestionsPayload(
  allStepsMaster: FormStep[],
  formAnswers: FormAnswers,
  mexicoAddress?: any,
  productBundleId?: string,
  paymentInfo?: PaymentInfo,
): Promise<any[]> {
  const questionsPayload: any[] = [];

  const isMexicoShipping = formAnswers.shipToMexico === "Yes";

  if (isMexicoShipping && mexicoAddress) {
    const mexicoAddressQuestions = [
      {
        question: "Mexico Address - Full Name",
        answer:
          formAnswers.firstName && formAnswers.lastName
            ? `${formAnswers.firstName} ${formAnswers.lastName}`.trim()
            : "",
        type: "TEXT",
        required: true,
      },
      {
        question: "Mexico Address - Street Address",
        answer: mexicoAddress.addressLine1 || "",
        type: "TEXT",
        required: true,
      },
      {
        question: "Mexico Address - Neighborhood",
        answer: mexicoAddress.addressLine2 || "",
        type: "TEXT",
        required: true,
      },
      {
        question: "Mexico Address - City",
        answer: mexicoAddress.city || "",
        type: "TEXT",
        required: true,
      },
      {
        question: "Mexico Address - State",
        answer: mexicoAddress.state || "",
        type: "TEXT",
        required: true,
      },
      {
        question: "Mexico Address - Postal Code",
        answer: mexicoAddress.postalCode || "",
        type: "TEXT",
        required: true,
      },
      {
        question: "Mexico Address - Country",
        answer: "MÉXICO",
        type: "TEXT",
        required: true,
      },
    ];

    questionsPayload.push(...mexicoAddressQuestions);
  }

  // Bundle medication questions (GLP-1 + NAD, or B12 + NAD when the product
  // bundle id matches the dedicated B12 SKU).
  if (formAnswers.bundleGLP && formAnswers.bundleNAD) {
    const isB12Bundle =
      productBundleId === "632a77ed-939e-438e-b57b-1c7e39cebf32";
    questionsPayload.push(
      {
        question: isB12Bundle
          ? "Selected B12 Treatment"
          : "Selected GLP-1 Medication",
        answer: formAnswers.bundleGLP,
        type: "SINGLESELECT",
        required: true,
      },
      {
        question: "Selected NAD+ Treatment",
        answer: formAnswers.bundleNAD,
        type: "SINGLESELECT",
        required: true,
      },
    );
  }

  for (const step of allStepsMaster) {
    for (const question of step.questions) {
      // Note: the reference also skips "PRODUCTSELECT", but that question
      // type doesn't exist in this codebase's `types/form.ts` so it's omitted.
      if (
        question.type === "MARKETING" ||
        question.type === "BEFORE_AFTER" ||
        question.type === "MEDICAL_REVIEW" ||
        !("apiType" in question)
      ) {
        continue;
      }

      const answer = formAnswers[question.id];

      if (answer === null || answer === undefined || answer === "") continue;
      if (Array.isArray(answer) && answer.length === 0) continue;

      const entry: {
        question: string;
        answer: any;
        type: string;
        options?: any[];
        required?: boolean;
      } = {
        question: question.question || `Question ${question.id}`,
        answer,
        type: "apiType" in question ? question.apiType : "TEXT",
      };

      if (entry.type === "FILE" && answer instanceof File) {
        const { convertFileToBase64 } = await import("~/utils/convertFile");
        const base64Data = await convertFileToBase64(answer);
        entry.answer = [
          { name: answer.name, contentType: answer.type, data: base64Data },
        ];
      } else if (
        entry.type === "FILE" &&
        typeof answer === "object" &&
        answer.name &&
        answer.contentType &&
        answer.data
      ) {
        entry.answer = [
          {
            name: answer.name,
            contentType: answer.contentType,
            data: answer.data,
          },
        ];
      }

      if (!entry.question || entry.question.trim() === "") {
        entry.question = `Question ${question.id}`;
      }

      if (entry.type === "FILE") {
        // already processed above
      } else if (entry.type === "SINGLESELECT") {
        entry.answer = Array.isArray(answer) ? answer[0] : answer;
      } else if (entry.type === "MULTISELECT") {
        const raw = Array.isArray(answer) ? answer : [answer];
        const allSelections = raw.map((item: any) =>
          typeof item === "string" ? item : String(item),
        );
        const realSelections = allSelections.filter(
          (item: string) => !isSentinel(item),
        );
        const nonSentinelOptions =
          "options" in question &&
          Array.isArray((question as any).options)
            ? (question as any).options
                .map((o: any) => getOptionLabel(o))
                .filter((label: string) => !isSentinel(label))
            : undefined;

        if (realSelections.length === 0) {
          const sentinelLabel =
            allSelections.find((item: string) => isSentinel(item)) ||
            "None of the above";
          entry.answer = sentinelLabel;
          entry.type = "SINGLESELECT";
          if (nonSentinelOptions)
            entry.options = [...nonSentinelOptions, sentinelLabel];
        } else {
          entry.answer = JSON.stringify(realSelections);
          if (nonSentinelOptions) entry.options = nonSentinelOptions;
        }
      } else {
        // TEXT and everything else — always a plain string
        entry.answer = Array.isArray(answer)
          ? answer
              .map((item: any) =>
                typeof item === "string" ? item : String(item),
              )
              .join(", ")
          : typeof answer === "string"
            ? answer
            : String(answer);
      }

      if (question.required) {
        entry.required = true;
      }

      questionsPayload.push(entry);
    }
  }

  // Append BMI if calculable — keeps it out of the per-step loop because the
  // BMI is a derived value, not a real question the user answered.
  try {
    const medicalValues = calculateMedicalValues(formAnswers);
    if (medicalValues.bmi && medicalValues.bmi !== "0.00") {
      questionsPayload.push({
        question: "BMI",
        answer: medicalValues.bmi,
        type: "TEXT",
      });
    }
  } catch (error) {
    console.warn("Failed to calculate BMI:", error);
  }

  // Append Consultation Type. Some states require synchronous (video) visits.
  // Form holds full state names ("New Mexico"); paymentInfo holds the 2-letter
  // abbreviation ("NM"); we accept either.
  {
    const restrictedAbbrevs = new Set(["NM", "MS", "KS", "WV", "RI"]);
    const restrictedFullNames = new Set([
      "New Mexico",
      "Mississippi",
      "Kansas",
      "West Virginia",
      "Rhode Island",
    ]);
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
 * Builds the Care Validate `/v1/cases` payload (the "new API" shape).
 *
 * Wire shape:
 *   - top level   → `isTest`, `forceCreate`, `user`, `products`, `payment?`
 *   - `user`      → identity + contact fields + `shippingAddress` + `languagePreferences`
 *   - `products`  → array; first (and only, for now) entry carries `subscription`
 *                   and the nested `form` (title, description, questions)
 *   - `payment`   → emitted only when a Stripe reference is present; the
 *                   `providerReference.type` is decided by the id prefix
 *                   (`pi_` → PAYMENT_INTENT, otherwise SETUP_INTENT).
 *
 * Question-array assembly is delegated to `buildQuestionsPayload` above and
 * is unchanged from the previous version.
 *
 * Throws when shipping address is incomplete — the caller is expected to
 * have collected a valid address via the Stripe Address Element before this
 * function runs.
 */
export async function buildFormPayloadNew(
  allStepsMaster: FormStep[],
  formAnswers: FormAnswers,
  finalSetupIntentId: string,
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  },
  paymentInfo?: PaymentInfo,
  config?: any,
  quizId?: string,
  productBundleId?: string,
): Promise<FormPayload> {
  const isMexicoShipping = formAnswers.shipToMexico === "Yes";

  let finalShippingAddress = shippingAddress;
  if (isMexicoShipping) {
    finalShippingAddress = {
      addressLine1: "Mexico",
      addressLine2: "",
      city: "Mexico City",
      state: "MX",
      postalCode: "06000",
      country: "Mexico",
    };
  }

  const mexicoAddress = isMexicoShipping ? shippingAddress : undefined;
  const questionsPayload = await buildQuestionsPayload(
    allStepsMaster,
    formAnswers,
    mexicoAddress,
    productBundleId,
    paymentInfo,
  );

  const dob =
    formAnswers.dob ??
    (formAnswers.dobYear && formAnswers.dobMonth && formAnswers.dobDay
      ? `${formAnswers.dobYear}-${String(formAnswers.dobMonth).padStart(2, "0")}-${String(formAnswers.dobDay).padStart(2, "0")}`
      : "");

  if (
    !finalShippingAddress ||
    !finalShippingAddress.addressLine1 ||
    !finalShippingAddress.city ||
    !finalShippingAddress.state ||
    !finalShippingAddress.postalCode
  ) {
    throw new Error("Please complete your shipping address information.");
  }

  const cleanShippingAddress: CleanShippingAddress = {
    addressLine1: finalShippingAddress.addressLine1,
    addressLine2: finalShippingAddress.addressLine2,
    city: finalShippingAddress.city,
    state: finalShippingAddress.state,
    postalCode: finalShippingAddress.postalCode,
    country: finalShippingAddress.country,
  };

  // Quiz config drives form title/description (matches the legacy builder).
  // Falls back to runtime config, then to generic strings.
  const quiz = quizId ? await getQuizById(quizId) : undefined;
  const formTitle =
    quiz?.name ?? config?.public?.formTitle ?? "Medical Intake Form";
  const formDescription =
    quiz?.description ??
    config?.public?.formDescription ??
    "Patient medical intake form";

  const isDevelopment = Boolean(config?.public?.isDevelopment);
  const isProduction = Boolean(config?.public?.isProduction);

  const product: ProductBlock = {
    id: productBundleId ?? "",
    subscription: planToSubscription(paymentInfo?.plan),
  };
  if (questionsPayload.length > 0) {
    product.form = {
      title: formTitle,
      description: formDescription,
      questions: questionsPayload,
    };
  }

  const payload: FormPayload = {
    isTest: !isProduction,
    forceCreate: false,
    user: {
      firstName: `${formAnswers.firstName ?? ""}${isDevelopment ? " Test" : ""}`,
      lastName: `${formAnswers.lastName ?? ""}${isDevelopment ? " Test" : ""}`,
      email: formAnswers.email ?? "",
      gender: (formAnswers.gender ?? "").toUpperCase(),
      phoneNumber:
        convertToInternationalFormat(
          formAnswers.phone ?? formAnswers.phoneNumber ?? "",
        ) ?? "",
      dob,
      languagePreferences: ["en"],
      shippingAddress: cleanShippingAddress,
    },
    products: [product],
  };

  if (paymentInfo?.nmiPaymentToken) {
    // NMI path: replace the Stripe providerReference with the Collect.js token.
    payload.payment = {
      amount: paymentInfo?.paymentAmount ?? 0.5,
      currency: "USD",
      description: paymentInfo?.paymentDescription ?? "Personalized Program",
      nmiPaymentToken: paymentInfo.nmiPaymentToken,
    };
  } else if (finalSetupIntentId) {
    payload.payment = {
      amount: paymentInfo?.paymentAmount ?? 0.5,
      currency: "USD",
      description: paymentInfo?.paymentDescription ?? "Personalized Program",
      providerReference: {
        type: finalSetupIntentId.startsWith("pi_")
          ? "PAYMENT_INTENT"
          : "SETUP_INTENT",
        id: finalSetupIntentId,
      },
    };
  }

  return payload;
}
