<template>
  <div>
    <label v-if="question.question" class="block text-base font-medium text-bodyColor mb-2">
      {{ question.question }}
    </label>
    
    <!-- Loading state -->
    <div v-if="initializing" class="text-sm text-gray-600 mb-4">
      <div>Setting up payment...</div>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="text-sm text-red-600 mb-4">
      {{ error }}
    </div>
    
    <!-- Stripe Elements Container -->
    <div class="space-y-6">
      <!-- Address Element -->
      <div>
        <label class="block text-xl font-medium text-bodyColor mb-6">
          Shipping Address
          <span v-if="isLocationDetected && !shouldShowMexicoForm" class="text-sm font-normal text-gray-600 ml-2">
            ({{ getCountryName(userCountry) }})
          </span>
        </label>
        
        <!-- Mexico Address Form -->
        <MexicoAddressForm 
          v-if="shouldShowMexicoForm"
          v-model="mexicoAddress"
          :form-answers="formAnswers"
          @update:modelValue="handleMexicoAddressUpdate"
        />
        
        <!-- Stripe Address Element -->
        <div 
          v-else
          id="element-address"
          class="form-input min-h-[60px] py-6 flex items-center stripe-element"
          :class="{ 'interacted': hasInteracted }"
        >
          <span class="text-gray-500">Loading address field...</span>
        </div>
      </div>
      
      <!-- Payment Element -->
      <div>
        <label class="block text-xl font-medium text-bodyColor mb-6">
          Payment Method
        </label>
        <div 
          id="element-payment"
          class="form-input min-h-[60px] py-6 flex items-center stripe-element"
          :class="{ 'interacted': hasInteracted }"
        >
          <span class="text-gray-500">Loading payment field...</span>
        </div>
        <!-- Payment Error Display -->
        <div v-if="paymentError" class="text-sm text-red-600 mt-2">
          {{ paymentError }}
        </div>
      </div>
    </div>
    
    <!-- Validation message -->
    <div v-if="showValidationMessage" class="text-sm text-red-600 mt-4">
      {{ validationMessage }}
    </div>
    
    <!-- Security notice -->
    <div class="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
      <p class="text-sm text-blue-800">
        <strong>Security Notice:</strong> For your security, payment information is not saved when you navigate away from this page. 
        You'll need to re-enter your payment details if you go back to previous steps.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import MexicoAddressForm from './MexicoAddressForm.vue'

// --- TYPE DEFINITIONS ---
interface StripePaymentQuestion {
  id: string
  question?: string
  required?: boolean
}

interface AddressInfo {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
}

// --- TEST CARD DETECTION ---
const TEST_CARD_PATTERNS = [
  /^4242424242424242$/, // Visa test card
  /^4000056655665556$/, // Visa debit test card
  /^5555555555554444$/, // Mastercard test card
  /^2223003122003222$/, // Mastercard test card
  /^4000002500003155$/, // Visa test card (requires authentication)
  /^4000000000000002$/, // Visa test card (declined)
  /^4000000000009995$/, // Visa test card (declined)
  /^4000000000009987$/, // Visa test card (declined)
  /^4000000000009979$/, // Visa test card (declined)
  /^4000000000000069$/, // Visa test card (expired)
  /^4000000000000127$/, // Visa test card (incorrect CVC)
  /^4000000000000119$/, // Visa test card (processing error)
];

const isTestCard = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  return TEST_CARD_PATTERNS.some(pattern => pattern.test(cleanNumber));
};

const detectTestCardFromElements = (elements: any): boolean => {
  try {
    // Try to get the card number from the payment element
    const paymentElement = elements.getElement('payment');
    if (paymentElement) {
      // This is a simplified approach - in practice, we'll need to listen for card number changes
      return false; // We'll handle this in the change event
    }
  } catch (error) {
    // Silent fail - we'll handle detection in the change event
  }
  return false;
};

// --- STATE ---
const initializing = ref(true)
const error = ref<string | null>(null)
const paymentError = ref<string | null>(null)
const hasInteracted = ref(false)
const isPaymentComplete = ref(false)
const isAddressComplete = ref(false)
const shippingAddress = ref<AddressInfo | null>(null)
const stripeRef = ref<any>(null)
const stripeElementsRef = ref<any>(null)
const isMounted = ref(true)
const userCountry = ref<string>('US') // Default to US
const isLocationDetected = ref(false)

// --- PROPS ---
const props = defineProps<{
  question: StripePaymentQuestion
  modelValue?: { stripeSetupId: string | null; shippingAddress: AddressInfo | null }
  formAnswers?: any
  shipToMexico?: boolean
}>()

// --- EMITS ---
const emit = defineEmits<{
  'update:modelValue': [value: { stripeSetupId: string | null; shippingAddress: AddressInfo | null }]
}>()

// --- COMPUTED ---
const getFullName = () => {
  const firstName = props.formAnswers?.firstName || ''
  const lastName = props.formAnswers?.lastName || ''
  return `${firstName} ${lastName}`.trim()
}

const countryNames: Record<string, string> = {
  'US': 'United States',
  'MX': 'Mexico',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'AU': 'Australia',
  'DE': 'Germany',
  'FR': 'France',
  'ES': 'Spain',
  'IT': 'Italy',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'BR': 'Brazil',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'PE': 'Peru',
  'VE': 'Venezuela',
  'EC': 'Ecuador',
  'BO': 'Bolivia',
  'PY': 'Paraguay',
  'UY': 'Uruguay',
  'GY': 'Guyana',
  'SR': 'Suriname',
  'GF': 'French Guiana',
  'FK': 'Falkland Islands',
  'GS': 'South Georgia and the South Sandwich Islands'
}

const getCountryName = (countryCode: string) => {
  return countryNames[countryCode] || countryCode
}

const canFinish = computed(() => {
  return isAddressComplete.value && isPaymentComplete.value
})

// Helper function to check if both elements are complete and emit model value
const updateFormValidity = () => {
  if (!isMounted.value) return
  
  if (isPaymentComplete.value && isAddressComplete.value && shippingAddress.value) {
    emit('update:modelValue', {
      stripeSetupId: 'ready',
      shippingAddress: shippingAddress.value
    })
  } else {
    emit('update:modelValue', {
      stripeSetupId: null,
      shippingAddress: null
    })
  }
}



// --- MEXICO ADDRESS HANDLING ---
const mexicoAddress = ref<any>(null)

const shouldShowMexicoForm = computed(() => {
  // Force US flow unless explicitly enabled via prop
  return props.shipToMexico === true
})

// Watch for changes in Mexico form visibility to reset address validation
watch(shouldShowMexicoForm, (showMexicoForm) => {
  if (showMexicoForm) {
    // When Mexico form is shown, reset address completion until fields are filled
    isAddressComplete.value = false
  }
})

const handleMexicoAddressUpdate = (address: any) => {
  mexicoAddress.value = address
  shippingAddress.value = address
  hasInteracted.value = true
  
  // Validate Mexico address using the same logic as Stripe address element
  // All required fields must be present and non-empty
  const isMexicoAddressComplete = address && 
    address.addressLine1 && address.addressLine1.trim() !== '' &&
    address.addressLine2 && address.addressLine2.trim() !== '' &&
    address.city && address.city.trim() !== '' &&
    address.state && address.state.trim() !== '' &&
    address.postalCode && address.postalCode.trim() !== '' &&
    address.postalCode.match(/^\d{5}$/) // Mexico postal codes are exactly 5 digits
  
  isAddressComplete.value = isMexicoAddressComplete
  
  // Update form validity immediately, just like the Stripe address element does
  updateFormValidity()
}

const showValidationMessage = computed(() => {
  return hasInteracted.value && (!isAddressComplete.value || !isPaymentComplete.value)
})

const validationMessage = computed(() => {
  if (!hasInteracted.value) return ''
  
  if (shouldShowMexicoForm.value && !isAddressComplete.value) {
    return 'Please complete all Mexico address fields'
  } else if (!isAddressComplete.value) {
    return 'Please complete your shipping address'
  } else if (!isPaymentComplete.value) {
    return 'Please complete your payment information'
  }
  
  return ''
})

// OLD STRIPE CONFIRMATION HANDLER - REMOVED
// This was causing duplicate event handling and double payment attempts
// Now using the new handleConfirmSetup system instead

// --- METHODS ---
// Detect user's country using multiple methods
const detectUserCountry = async () => {
  try {
    // Method 1: Try geolocation API
    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: false
        })
      })
      
      // Use reverse geocoding to get country from coordinates
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
      )
      const data = await response.json()
      
      if (data.countryCode) {
        userCountry.value = data.countryCode.toUpperCase()
        isLocationDetected.value = true
        return
      }
    }
  } catch (error) {
    console.log('Geolocation failed, trying IP-based detection...')
  }
  
  try {
    // Method 2: IP-based country detection (fallback)
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    
    if (data.country_code) {
      userCountry.value = data.country_code.toUpperCase()
      isLocationDetected.value = true
      return
    }
  } catch (error) {
    console.log('IP-based detection failed, using default US')
  }
  
  // Default to US if all methods fail
  userCountry.value = 'US'
  isLocationDetected.value = true
}

const performPayment = async () => {
  const elements = stripeElementsRef.value
  const shippingAddr = shippingAddress.value
  
  
  if (!stripeRef.value || !elements) {
    console.error('❌ [StripePayment] Payment system not initialized');
    throw new Error('Payment system not initialized')
  }
  
  // Final test card check before submission
  const config = useRuntimeConfig()
  if (config.public.nodeEnv === 'production') {
    try {
      const paymentElement = elements.getElement('payment');
      if (paymentElement) {
        const paymentMethod = await paymentElement.getValue();
        // Only check for test cards if the payment method is a card
        if (paymentMethod?.type === 'card') {
          const cardNumber = paymentMethod.card?.number;
          if (cardNumber && isTestCard(cardNumber)) {
            throw new Error('Test cards are not allowed in production. Please use a real credit card.');
          }
        }
      }
    } catch (error) {
      // If we can't check the card number, continue with the payment
      // The error will be caught by Stripe if it's a test card
    }
  }
  
  try {
    const result = await stripeRef.value.confirmSetup({
      elements: elements,
      redirect: 'if_required',
      confirmParams: {
        payment_method_data: { 
          billing_details: { 
            email: props.formAnswers?.email 
          } 
        }
      }
    })
    
    const error = result?.error
    if (error) {
      if (error.type === 'validation_error') {
        // do nothing, validation errors are handled by stripe elements UI
        return null
      } else {
        // Handle specific error types
        let errorMessage = 'Payment failed. Please try again.';
        
        if (error.message?.includes('test card') || error.message?.includes('live mode')) {
          errorMessage = 'Test cards are not allowed in production. Please use a real credit card.';
        } else if (error.message?.includes('declined')) {
          errorMessage = 'Your card was declined. Please check your card details and try again.';
        } else if (error.message?.includes('expired')) {
          errorMessage = 'Your card has expired. Please use a different card.';
        } else if (error.message?.includes('CVC')) {
          errorMessage = 'Invalid CVC code. Please check and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Dispatch error event
        const errorEvent = new CustomEvent('stripe-confirmation-error', {
          detail: { error: errorMessage }
        })
        window.dispatchEvent(errorEvent)
        
        throw new Error(errorMessage);
      }
    } else {
      const setupIntent = result?.setupIntent
      if (setupIntent && setupIntent.status === 'succeeded') {
        // Dispatch success event with the confirmed setup intent
        const successEvent = new CustomEvent('stripe-confirmation-success', {
          detail: { setupIntent: setupIntent.id }
        })
        window.dispatchEvent(successEvent)
        
        return { 
          stripePaymentId: setupIntent.id, 
          shippingAddress: shippingAddr 
        }
      } else {
        const errorMessage = 'Payment was not successful. Please try again.'
        
        // Dispatch error event
        const errorEvent = new CustomEvent('stripe-confirmation-error', {
          detail: { error: errorMessage }
        })
        window.dispatchEvent(errorEvent)
        
        throw new Error(errorMessage)
      }
    }
  } catch (err: any) {
    console.error('❌ [StripePayment] Payment confirmation error caught:', err)
    
    // Show specific error message
    const errorMessage = err.message || 'Payment failed. Please try again.';
    
    // Dispatch error event
    const errorEvent = new CustomEvent('stripe-confirmation-error', {
      detail: { error: errorMessage }
    })
    window.dispatchEvent(errorEvent)
    
    // Show error to user
    if (import.meta.client) {
      const { useToast } = await import('vue-toastification');
      const toast = useToast();
      toast.error(errorMessage);
    }
    throw err
  }
  
  return undefined
}

// Expose the payment method and validation state
defineExpose({
  performPayment,
  canFinish
})

// --- LIFECYCLE ---
onMounted(async () => {
  if (!import.meta.client) return
  
  isMounted.value = true
  initializing.value = true
  error.value = null
  
  // Set up event listener for payment confirmation
  const handleConfirmSetup = async () => {
    try {
      const result = await performPayment()
      
      if (result && result.stripePaymentId) {
        // Update the form with the confirmed SetupIntent ID
        emit('update:modelValue', {
          stripeSetupId: result.stripePaymentId,
          shippingAddress: result.shippingAddress
        })
      } else {
        // Reset to null on failure
        emit('update:modelValue', {
          stripeSetupId: null,
          shippingAddress: null
        })
      }
    } catch (error) {
      console.error('❌ [StripePayment] Payment failed with error:', error)
      // Reset to null on failure
      emit('update:modelValue', {
        stripeSetupId: null,
        shippingAddress: null
      })
    }
  }
  
  // Clean up event listener on unmount - MUST be before any await statements
  onUnmounted(() => {
    window.removeEventListener('stripe-confirm-setup', handleConfirmSetup)
  })
  
  window.addEventListener('stripe-confirm-setup', handleConfirmSetup)
  
  // Skip country detection - always use US format for Stripe
  userCountry.value = 'US'
  isLocationDetected.value = true
  
  try {
    // Load Stripe
    const config = useRuntimeConfig()
    const stripe = await loadStripe(config.public.stripePublishableKey)
    
    if (!stripe || !isMounted.value) {
      throw new Error('Failed to load Stripe')
    }
    
    // Create SetupIntent on server
    // Note: This creates a fresh SetupIntent each time the component mounts
    // This is important for handling payment retries after failed submissions
    // Each submission attempt gets a new SetupIntent to prevent reuse of confirmed IDs
    const response = await $fetch<{ clientSecret: string }>(
      "/api/create-setup-intent",
      {
        method: "POST",
      }
    )
    
    const stripeClientSecret = response.clientSecret
    
    // Check if component is still mounted
    if (!isMounted.value) {
      return
    }
    
    // Create Elements
    const elements = stripe.elements({
      clientSecret: stripeClientSecret,
      appearance: { 
        variables: { 
          colorPrimary: '#3b82f6', // blue-500
          fontSizeBase: '16px', // Prevent iOS zoom on input focus
          spacingUnit: '4px'
        } 
      }
    })
    
    // Create Payment Element
    const paymentElement = elements.create('payment', {
      defaultValues: {
        billingDetails: { 
          email: props.formAnswers?.email, 
          name: getFullName() 
        }
      }
    })
    
    // Create Address Element only if not showing Mexico form
    let addressElement: any = null
    if (!shouldShowMexicoForm.value) {
      addressElement = elements.create('address', {
        mode: 'shipping',
        allowedCountries: ['US'],
        defaultValues: { 
          name: getFullName() 
        }
      })
    }
    
    // Set up address element event listener only if address element exists
    if (addressElement) {
      addressElement.on('change', (e: any) => {
        if (!isMounted.value) return
        
        hasInteracted.value = true
        isAddressComplete.value = e.complete
        
        const addr = e.value?.address
        if (e.complete && addr) {
          shippingAddress.value = {
            addressLine1: addr.line1 || '',
            addressLine2: addr.line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            country: addr.country || 'US',
            postalCode: addr.postal_code || '',
          }
        } else {
          shippingAddress.value = null
        }
        
        // Update form validity based on both elements
        updateFormValidity()
      })
    }
    
    // Set up payment element event listener
    paymentElement.on('change', (e: any) => {
      if (!isMounted.value) return
      
      hasInteracted.value = true
      isPaymentComplete.value = e.complete
      paymentError.value = e.error ? e.error.message : null
      
      // Test card detection - only check for cards, not other payment methods
      if (e.complete && config.public.nodeEnv === 'production') {
        try {
          // Only check for test cards if the payment method is a card
          const paymentMethod = e.value?.paymentMethod;
          if (paymentMethod?.type === 'card') {
            const cardNumber = paymentMethod.card?.number;
            if (cardNumber && isTestCard(cardNumber)) {
              paymentError.value = 'Test cards are not allowed in production. Please use a real credit card.';
              isPaymentComplete.value = false;
              return;
            }
          }
        } catch (error) {
          // Silent fail - continue with normal validation
        }
      }
      
      // Update form validity based on both elements
      updateFormValidity()
    })
    
    // Wait for DOM to be ready before mounting
    await nextTick()
    
    // Check if component is still mounted and elements exist
    if (!isMounted.value) {
      return
    }
    
    const paymentElementContainer = document.getElementById('element-payment')
    const addressElementContainer = document.getElementById('element-address')
    
    if (!paymentElementContainer) {
      throw new Error('Payment element not found in DOM')
    }
    
    if (!shouldShowMexicoForm.value && !addressElementContainer) {
      throw new Error('Address element not found in DOM')
    }
    
    // Mount elements
    paymentElement.mount('#element-payment')
    if (addressElement && addressElementContainer) {
      addressElement.mount('#element-address')
    }
    
    // Store references only if still mounted
    if (isMounted.value) {
      stripeRef.value = stripe
      stripeElementsRef.value = elements
      
      // Event listener is now handled by handleConfirmSetup in the main component scope
    }
    
  } catch (err: any) {
    console.error('Error initializing Stripe:', err)
    
    // Only show error if component is still mounted
    if (isMounted.value && initializing.value) {
      const errorMessage = err.message || 'Stripe error';
      error.value = errorMessage;
      
      // Show error to user only if component is still mounted
      if (import.meta.client && isMounted.value) {
        const { useToast } = await import('vue-toastification');
        const toast = useToast();
        toast.error(errorMessage);
      }
    }
  } finally {
    if (isMounted.value) {
      initializing.value = false
    }
  }
})

// Clean up on component unmount
onUnmounted(() => {
  isMounted.value = false
  
  if (stripeElementsRef.value) {
    try {
      const addressElement = stripeElementsRef.value.getElement('address')
      const paymentElement = stripeElementsRef.value.getElement('payment')
      
      if (addressElement) {
        addressElement.destroy()
      }
      if (paymentElement) {
        paymentElement.destroy()
      }
    } catch (error) {
      // Silent cleanup error
    }
  }
  
  // Event listener cleanup is now handled by handleConfirmSetup cleanup
})
</script>

<style scoped>
.form-input {
  @apply block w-full border-2 rounded-xl border-bodyColor bg-gray-50 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-accentColor1 transition-colors duration-200
}

/* Hide Stripe validation messages until user has interacted */
:deep(.stripe-element) {
  --stripe-validation-opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.stripe-element.interacted) {
  --stripe-validation-opacity: 1;
}

/* Target Stripe's error messages */
:deep(.stripe-element [data-testid="error-message"]) {
  opacity: var(--stripe-validation-opacity);
}

/* Alternative approach: hide all error messages initially */
:deep(.stripe-element .error) {
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.stripe-element.interacted .error) {
  opacity: 1;
}
</style>
