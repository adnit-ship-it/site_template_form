export default defineEventHandler(async (event) => {
  try {
    // Get the current SetupIntent from the request body
    const body = await readBody(event);
    const { clientSecret } = body;

    if (!clientSecret) {
      throw createError({
        statusCode: 400,
        statusMessage: "Client secret is required",
      });
    }

    // Extract SetupIntent ID from client secret
    const setupIntentId = clientSecret.split("_secret_")[0];

    // Return the SetupIntent ID and status
    // Note: We're not actually confirming anything server-side since the payment
    // setup is handled by the CareValidate API
    return {
      setupIntentId: setupIntentId,
      status: "succeeded", // Assuming success since client secret was provided
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to confirm payment setup",
    });
  }
});
