import type { FormAnswers, FormStep } from "~/types/form";
import { convertToInternationalFormat } from "~/utils/validation";

interface PaymentInfo {
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
  promoCode?: string;
}

interface FormPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  paymentDescription: string;
  paymentAmount: number;
  stripeSetupId: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  formTitle: string;
  formDescription: string;
  questions: any[];
  promoCodes: Record<string, string>;
}

/**
 * Assembles the questions payload array for API submission
 */
export async function buildQuestionsPayload(
  allStepsMaster: FormStep[],
  formAnswers: FormAnswers,
  mexicoAddress?: any
): Promise<any[]> {
  const questionsPayload = [];

  const isMexicoShipping = formAnswers.shipToMexico === 'Yes';

  if (isMexicoShipping && mexicoAddress) {
    const mexicoAddressQuestions = [
      {
        question: "Mexico Address - Full Name",
        answer: formAnswers.firstName && formAnswers.lastName
          ? `${formAnswers.firstName} ${formAnswers.lastName}`.trim()
          : "",
        type: "TEXT",
        required: true
      },
      {
        question: "Mexico Address - Street Address",
        answer: mexicoAddress.addressLine1 || "",
        type: "TEXT",
        required: true
      },
      {
        question: "Mexico Address - Neighborhood",
        answer: mexicoAddress.addressLine2 || "",
        type: "TEXT",
        required: true
      },
      {
        question: "Mexico Address - City",
        answer: mexicoAddress.city || "",
        type: "TEXT",
        required: true
      },
      {
        question: "Mexico Address - State",
        answer: mexicoAddress.state || "",
        type: "TEXT",
        required: true
      },
      {
        question: "Mexico Address - Postal Code",
        answer: mexicoAddress.postalCode || "",
        type: "TEXT",
        required: true
      },
      {
        question: "Mexico Address - Country",
        answer: "MÉXICO",
        type: "TEXT",
        required: true
      }
    ];

    questionsPayload.push(...mexicoAddressQuestions);
  }

  for (const step of allStepsMaster) {
    for (const question of step.questions) {
      if (
        question.type === "MARKETING" ||
        question.type === "BEFORE_AFTER" ||
        question.type === "MEDICAL_REVIEW" ||
        question.type === "PRODUCTSELECT" ||
        !("apiType" in question)
      ) {
        continue;
      }

      let answer = formAnswers[question.id];

      if (answer === null || answer === undefined || answer === "") {
        continue;
      }

      const questionPayloadObject: {
        question: string;
        answer: any;
        type: string;
        options?: any[];
        required?: boolean;
      } = {
        question: question.question || `Question ${question.id}`,
        answer: answer,
        type: "apiType" in question ? question.apiType : "TEXT",
      };

      if (questionPayloadObject.type === "FILE" && answer instanceof File) {
        const { convertFileToBase64 } = await import(
          "~/utils/convertFile"
        );
        const base64Data = await convertFileToBase64(answer);
        questionPayloadObject.answer = [
          { name: answer.name, contentType: answer.type, data: base64Data },
        ];
      } else if (
        questionPayloadObject.type === "FILE" &&
        typeof answer === "object" &&
        answer.name &&
        answer.contentType &&
        answer.data
      ) {
        questionPayloadObject.answer = [
          {
            name: answer.name,
            contentType: answer.contentType,
            data: answer.data,
          },
        ];
      }

      if (
        !questionPayloadObject.question ||
        questionPayloadObject.question.trim() === ""
      ) {
        questionPayloadObject.question = `Question ${question.id}`;
      }

      if (questionPayloadObject.type === "FILE") {
        // already processed above
      } else if (questionPayloadObject.type === "SINGLESELECT") {
        questionPayloadObject.answer = Array.isArray(answer)
          ? answer[0]
          : answer;
      } else if (questionPayloadObject.type === "MULTISELECT") {
        questionPayloadObject.answer = Array.isArray(answer)
          ? answer
          : [answer];
      } else {
        if (Array.isArray(answer)) {
          questionPayloadObject.answer = answer.map((item: any) =>
            typeof item === "string" ? item : String(item),
          );
        } else {
          questionPayloadObject.answer =
            typeof answer === "string" ? answer : String(answer);
        }
      }

      if (
        "options" in question &&
        question.options &&
        Array.isArray(question.options) &&
        question.options.length > 0
      ) {
        questionPayloadObject.options = question.options.map((option) =>
          typeof option === "string" ? option : String(option),
        );
      }

      if (question.required) {
        questionPayloadObject.required = true;
      }

      questionsPayload.push(questionPayloadObject);
    }
  }

  return questionsPayload;
}

/**
 * Builds the form payload for the new API submission format.
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
): Promise<FormPayload> {
  const isMexicoShipping = formAnswers.shipToMexico === 'Yes';

  let finalShippingAddress = shippingAddress;
  if (isMexicoShipping) {
    finalShippingAddress = {
      addressLine1: "Mexico",
      addressLine2: "",
      city: "Mexico City",
      state: "MX",
      postalCode: "06000",
      country: "Mexico"
    };
  }

  const mexicoAddress = isMexicoShipping ? shippingAddress : undefined;
  const questionsPayload = await buildQuestionsPayload(
    allStepsMaster,
    formAnswers,
    mexicoAddress
  );

  const dob =
    formAnswers.dob ??
    (formAnswers.dobYear && formAnswers.dobMonth && formAnswers.dobDay
      ? `${formAnswers.dobYear}-${String(formAnswers.dobMonth).padStart(2, "0")}-${String(formAnswers.dobDay).padStart(2, "0")}`
      : "");

  return {
    firstName: formAnswers.firstName ?? "",
    lastName: formAnswers.lastName ?? "",
    email: formAnswers.email ?? "",
    phoneNumber:
      convertToInternationalFormat(
        formAnswers.phoneNumber ?? formAnswers.phone ?? "",
      ) ?? "",
    dob,
    gender: formAnswers.gender?.toUpperCase() ?? "",
    paymentDescription: paymentInfo?.paymentDescription ?? "Form Submission",
    paymentAmount: paymentInfo?.paymentAmount ?? 0,
    stripeSetupId: finalSetupIntentId,
    shippingAddress: finalShippingAddress,
    formTitle: config?.public?.formTitle ?? "Form Submission",
    formDescription: config?.public?.formDescription ?? "Form Description",
    questions: questionsPayload,
    promoCodes:
      paymentInfo?.promoCode && paymentInfo.promoCode.trim()
        ? { Promo: paymentInfo.promoCode.trim() }
        : {},
  };
}
