export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  const apiKey = config.careValidateApiKey;
  const isDevelopment = config.public.isDevelopment;
  const apiUrl = isDevelopment
    ? "https://api-staging.care360-next.carevalidate.com/api/v1/payments/setup"
    : "https://api.care360-next.carevalidate.com/api/v1/payments/setup";

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing CareValidate API key configuration",
    });
  }

  try {
    // Use $fetch to make the API call from the server
    const response = await $fetch<{ paymentSecret: string }>(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: {}, // Empty body as per the curl example
    });

    // Return the successful response to the client
    return { success: true, clientSecret: response.paymentSecret };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create payment setup.",
      data: error.data,
    });
  }
});
