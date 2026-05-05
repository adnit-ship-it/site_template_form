import { resolveEnvMode } from "~/server/utils/envMode";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { apiKey, apiUrl, useStaging, isEmbed } = resolveEnvMode(event);

  if (!apiKey || !apiUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing CareValidate configuration",
    });
  }

  if (isEmbed && useStaging) {
    console.info("[submit-form] Embedded request → routing to staging CareValidate org");
  }

  const config = useRuntimeConfig();
  const useNewAPI = config.public.useNewAPI as boolean;

  const basePath = apiUrl.replace(/\/$/, "");
  const submitUrl = useNewAPI ? `${basePath}/cases` : `${basePath}/dynamic-case`;

  try {
    const response = await $fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: body,
    });

    return { success: true, data: response };
  } catch (error: any) {
    console.error("CareValidate API Error:", {
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      message: error.message,
    });

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create patient case.",
      data: error.data,
    });
  }
});
