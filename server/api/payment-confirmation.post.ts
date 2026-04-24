export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  
  const { 
    caseId, 
    amount, 
    paymentDate, 
    status, 
    validUntil, 
    description 
  } = body;

  // Validate required fields
  if (!caseId) {
    throw createError({
      statusCode: 400,
      statusMessage: "caseId is required",
    });
  }

  if (!amount || amount < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Valid amount is required",
    });
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
      statusMessage: "status is required (PAID, UNPAID, CANCELED, IN_DISPUTE, LOST_DISPUTE, REFUND, ERROR)",
    });
  }

  if (!validUntil) {
    throw createError({
      statusCode: 400,
      statusMessage: "validUntil is required (ISO format YYYY-MM-DD)",
    });
  }

  const apiKey = config.careValidateApiKey;
  const isDevelopment = config.public.isDevelopment;

  const apiUrl = isDevelopment
    ? "https://api-staging.care360-next.carevalidate.com/api/v1/customer-payment-confirmation"
    : "https://api.care360-next.carevalidate.com/api/v1/customer-payment-confirmation";

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing CareValidate API key configuration",
    });
  }

  try {

    // Call CareValidate payment confirmation endpoint
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
        ...(description && { description })
      },
    });

    // Return success response
    return { 
      success: true, 
      message: 'Payment confirmation sent successfully',
      data: response 
    };
  } catch (error: any) {
    console.error('❌ [Payment Confirmation] CareValidate error:', {
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      message: error.message
    });
    
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to confirm payment with CareValidate.",
      data: error.data,
    });
  }
});
