import { resolveEnvMode } from "~/server/utils/envMode";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { amount, paymentMethodTypes } = body;

  if (!amount || amount < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "Amount is required and must be at least 1",
    });
  }

  const { apiKey, apiHostBase } = resolveEnvMode(event);

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing CareValidate API key configuration",
    });
  }

  const apiUrl = `${apiHostBase}/payments/intent`;

  try {
    const response = await $fetch<{ data: { paymentIntentSecret: string } }>(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: {
        amount,
        paymentMethodTypes: paymentMethodTypes || ["klarna", "affirm", "afterpay_clearpay"],
      },
    });

    return { success: true, clientSecret: response.data.paymentIntentSecret };
  } catch (error: any) {
    console.error("[Backend] CareValidate error:", {
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      message: error.message,
    });

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create payment intent.",
      data: error.data,
    });
  }
});
