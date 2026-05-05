import { resolveEnvMode } from "~/server/utils/envMode";

export default defineEventHandler(async (event) => {
  const { apiKey, apiHostBase } = resolveEnvMode(event);

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing CareValidate API key configuration",
    });
  }

  const apiUrl = `${apiHostBase}/payments/setup`;

  try {
    const response = await $fetch<{ paymentSecret: string }>(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: {},
    });

    return { success: true, clientSecret: response.paymentSecret };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create payment setup.",
      data: error.data,
    });
  }
});
