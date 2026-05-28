import { resolveEnvMode } from "~/server/utils/envMode";

const LOG_PREFIX = "[create-abandoned-lead]";

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    email: string;
    firstName?: string;
    lastName?: string;
    weight?: string;
    formTitle?: string;
    formDescription?: string;
    productBundleId?: string;
  };

  const { apiKey, apiUrl, useStaging, isEmbed } = resolveEnvMode(event);

  if (!apiUrl) {
    console.error(LOG_PREFIX, "FATAL: careValidate apiUrl is not set.");
    throw createError({
      statusCode: 500,
      statusMessage: "Server misconfiguration: Care Validate API URL is not set.",
    });
  }
  if (!apiKey) {
    console.error(LOG_PREFIX, "FATAL: careValidate apiKey is not set.");
    throw createError({
      statusCode: 500,
      statusMessage: "Server misconfiguration: Care Validate API key is not set.",
    });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: "email is required." });
  }

  if (isEmbed && useStaging) {
    console.info(LOG_PREFIX, "Embedded request → routing to staging CareValidate org");
  }

  const config = useRuntimeConfig(event);
  const formTitle = body.formTitle || "Medical Intake Form";
  const formDescription = body.formDescription || "Patient medical intake form";

  // Match the new-API payload shape used by submit-form (user-wrapped, with
  // an embedded form on each product) so the same Care Validate /cases
  // endpoint accepts it. status=ABANDONED creates a Lead case.
  const payload = {
    isTest: !config.public.isProduction,
    forceCreate: false,
    status: "ABANDONED",
    user: {
      firstName: body.firstName || "Unknown",
      lastName: body.lastName || "Unknown",
      email,
      languagePreferences: ["en"],
    },
    products: [
      {
        id: body.productBundleId,
        form: {
          title: formTitle,
          description: formDescription,
          questions: [
            {
              question: "What is your current weight?",
              type: "TEXT",
              required: true,
              answer: body.weight ? String(body.weight) : "Not yet provided",
              phi: false,
            },
          ],
        },
      },
    ],
  };

  // The runtime apiUrl is the base (e.g. .../api/v1). The abandoned-lead
  // payload uses the new-API shape, which Care Validate accepts at /cases.
  const submitUrl = `${apiUrl.replace(/\/$/, "")}/cases`;

  try {
    const response = await $fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: payload,
    });
    return { success: true, data: response };
  } catch (error: any) {
    const statusCode = error.statusCode ?? error.response?.status;
    const statusMessage = error.statusMessage ?? error.message;
    const cvData = error.data ?? error.response?._data ?? error.response?.data;

    console.error(LOG_PREFIX, "Care Validate API error", {
      statusCode,
      statusMessage,
      cvData: JSON.stringify(cvData),
    });

    // 409 means a lead already exists for this email — treat as non-fatal
    if (statusCode === 409) {
      return { success: true, data: null };
    }

    throw createError({
      statusCode: statusCode || 500,
      statusMessage: statusMessage || "Failed to create abandoned lead.",
      data: { cvError: cvData },
    });
  }
});
