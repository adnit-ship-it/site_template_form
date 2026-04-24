export default defineEventHandler(async (event) => {
  // Get the form data that was sent from our client-side composable
  const body = await readBody(event);

  // Get the runtime configuration, which includes our secret API key
  const config = useRuntimeConfig();

  const apiKey = config.careValidateApiKey;
  const apiUrl = config.public.careValidateApiUrl;

  try {
    // Use $fetch to make the API call from the server
    const response = await $fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cv-api-key": apiKey,
      },
      body: body,
    });
    
    // Return the successful response to the client
    return { success: true, data: response };
  } catch (error: any) {
    console.error('❌ CareValidate API Error:', {
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      message: error.message
    });
    
    // Forward all errors to the client without bypassing
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create patient case.",
      data: error.data,
    });
  }
});
