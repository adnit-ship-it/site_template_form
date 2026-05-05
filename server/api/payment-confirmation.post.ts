import { resolveEnvMode } from "~/server/utils/envMode";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { caseId, amount, paymentDate, status, validUntil, description } = body;

  if (!caseId) {
    throw createError({ statusCode: 400, statusMessage: "caseId is required" });
  }
  if (!amount || amount < 0) {
    throw createError({ statusCode: 400, statusMessage: "Valid amount is required" });
  }
  if (!paymentDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "paymentDate is required (ISO format YYYY-MM-DD)",
    });
  }
  if (!status) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "status is required (PAID, UNPAID, CANCELED, IN_DISPUTE, LOST_DISPUTE, REFUND, ERROR)",
    });
  }
  if (!validUntil) {
    throw createError({
      statusCode: 400,
      statusMessage: "validUntil is required (ISO format YYYY-MM-DD)",
    });
  }

  const { apiKey, apiHostBase } = resolveEnvMode(event);

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing CareValidate API key configuration",
    });
  }

  const apiUrl = `${apiHostBase}/customer-payment-confirmation`;

  try {
    const response = await $fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: {
        caseId,
        amount,
        paymentDate,
        status,
        validUntil,
        ...(description && { description }),
      },
    });

    return {
      success: true,
      message: "Payment confirmation sent successfully",
      data: response,
    };
  } catch (error: any) {
    console.error("[Payment Confirmation] CareValidate error:", {
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      message: error.message,
    });

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to confirm payment with CareValidate.",
      data: error.data,
    });
  }
});
