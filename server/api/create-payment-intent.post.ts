export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const { amount, paymentMethodTypes } = body;

  if (!amount || amount < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "Amount is required and must be at least 1",
    });
  }

  const apiKey = config.careValidateApiKey;
  const isDevelopment = config.public.isDevelopment;

  const apiUrl = isDevelopment
    ? "https://api-staging.care360-next.carevalidate.com/api/v1/payments/intent"
    : "https://api.care360-next.carevalidate.com/api/v1/payments/intent";

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing CareValidate API key configuration",
    });
  }

  try {
    // Use $fetch to make the API call from the server
    const response = await $fetch<{ data: { paymentIntentSecret: string } }>(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: {
        amount,
        paymentMethodTypes: paymentMethodTypes || ['klarna', 'affirm', 'afterpay_clearpay'],
      },
    });

    // Return the successful response to the client
    return { success: true, clientSecret: response.data.paymentIntentSecret };
  } catch (error: any) {
    console.error('❌ [Backend] CareValidate error:', {
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      message: error.message
    });
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create payment intent.",
      data: error.data,
    });
  }
});

