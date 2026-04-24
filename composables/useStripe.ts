import { ref, computed } from "vue";
import { loadStripe } from "@stripe/stripe-js";

// Singleton pattern to ensure all components access the same instance
let stripeInstance = ref<any>(null);
let elementsInstance = ref<any>(null);
let clientSecretInstance = ref<string | null>(null);
let isLoadingInstance = ref(false);
let errorInstance = ref<string | null>(null);
let isReadyInstance = ref(false);
let isInitializingInstance = ref(false);

export const useStripe = () => {
  // Use computed properties that automatically update when singletons change
  const stripe = computed(() => stripeInstance.value);
  const elements = computed(() => elementsInstance.value);
  const clientSecret = computed(() => clientSecretInstance.value);
  const isLoading = computed(() => isLoadingInstance.value);
  const error = computed(() => errorInstance.value);
  const isReady = computed(() => isReadyInstance.value);

  const initializeStripe = async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializingInstance.value) {
      return;
    }

    // If already initialized, return early
    if (isReadyInstance.value && elementsInstance.value) {
      return;
    }

    try {
      isInitializingInstance.value = true;
      isLoadingInstance.value = true;
      errorInstance.value = null;
      isReadyInstance.value = false;

      // Load Stripe
      const config = useRuntimeConfig();

      // Check if publishable key is available
      if (!config.public.stripePublishableKey) {
        console.error('❌ [useStripe] No Stripe publishable key found in config');
        throw new Error(
          "Stripe publishable key is not configured. Please check your environment variables."
        );
      }

      stripeInstance.value = await loadStripe(
        config.public.stripePublishableKey as string
      );

      if (!stripeInstance.value) {
        console.error('❌ [useStripe] Failed to load Stripe library');
        throw new Error("Failed to load Stripe");
      }

      // Create SetupIntent on server
      try {
        const response = await $fetch<{ clientSecret: string }>(
          "/api/create-setup-intent",
          {
            method: "POST",
          }
        );
        clientSecretInstance.value = response.clientSecret;
      } catch (setupError: any) {
        console.error('❌ [useStripe] Failed to create SetupIntent:', {
          status: setupError.status,
          statusCode: setupError.statusCode,
          statusMessage: setupError.statusMessage,
          message: setupError.message,
          data: setupError.data
        });
        throw setupError;
      }

      // Create Elements
      try {
        elementsInstance.value = stripeInstance.value.elements({
          clientSecret: clientSecretInstance.value,
        });
      } catch (elementsError: any) {
        console.error('❌ [useStripe] Failed to create Elements:', elementsError);
        throw elementsError;
      }

      // Mark as ready
      isReadyInstance.value = true;
      isLoadingInstance.value = false;
      isInitializingInstance.value = false;
    } catch (err: any) {
      console.error("❌ [useStripe] Error initializing Stripe:", err);
      console.error("❌ [useStripe] Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause
      });
      errorInstance.value = "Failed to initialize payment system";
      isLoadingInstance.value = false;
      isReadyInstance.value = false;
      isInitializingInstance.value = false;
    }
  };

  const confirmSetup = async (elements?: any) => {
    if (!stripeInstance.value) {
      errorInstance.value = "Payment system not initialized";
      return null;
    }

    // Use provided elements or fall back to global elements
    const elementsToUse = elements || elementsInstance.value;
    if (!elementsToUse) {
      errorInstance.value = "Payment elements not available";
      return null;
    }

    try {
      isLoadingInstance.value = true;
      errorInstance.value = null;

      const result = await stripeInstance.value.confirmSetup({
        elements: elementsToUse,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.origin + "/checkout",
        },
      });

      isLoadingInstance.value = false;
      return result;
    } catch (err: any) {
      console.error("Error confirming setup:", err);
      errorInstance.value = "Payment setup failed";
      isLoadingInstance.value = false;
      return null;
    }
  };

  const cleanup = () => {
    if (elementsInstance.value) {
      try {
        // Get all elements and destroy them
        const addressElement = elementsInstance.value.getElement("address");
        const paymentElement = elementsInstance.value.getElement("payment");

        if (addressElement) {
          addressElement.destroy();
        }
        if (paymentElement) {
          paymentElement.destroy();
        }
      } catch (error) {
        // Silent cleanup error
      }
    }

    // Reset all instances
    elementsInstance.value = null;
    clientSecretInstance.value = null;
    isReadyInstance.value = false;
    isLoadingInstance.value = false;
    errorInstance.value = null;
    isInitializingInstance.value = false;
  };

  return {
    stripe,
    elements,
    clientSecret,
    isLoading,
    error,
    isReady,
    initializeStripe,
    confirmSetup,
    cleanup,
  };
};
