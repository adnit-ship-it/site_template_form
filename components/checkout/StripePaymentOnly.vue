<template>
  <div class="w-full">
    <!-- Error message -->
    <div v-if="error" class="text-sm text-red-600 mb-4">
      {{ error }}
    </div>

    <!-- Skeleton loader -->
    <div v-if="initializing" class="w-full space-y-4 animate-pulse">
      <div>
        <div class="h-3 w-24 bg-gray-200 rounded mb-2"></div>
        <div class="h-11 w-full bg-gray-200 rounded"></div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="h-3 w-20 bg-gray-200 rounded mb-2"></div>
          <div class="h-11 w-full bg-gray-200 rounded"></div>
        </div>
        <div>
          <div class="h-3 w-10 bg-gray-200 rounded mb-2"></div>
          <div class="h-11 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Payment Element -->
    <div id="element-payment-only" class="w-full form-input min-h-[60px] py-6 flex items-center stripe-element"
      :class="[initializing ? 'invisible absolute pointer-events-none' : '', { 'interacted': hasInteracted }]">
    </div>

    <!-- Payment Error Display -->
    <div v-if="paymentError" class="text-sm text-red-600 mt-2">
      {{ paymentError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { loadStripe } from '@stripe/stripe-js'

interface Props {
  formAnswers?: any
}

interface Emits {
  (e: 'payment-update', complete: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const initializing = ref(true)
const error = ref<string | null>(null)
const isMounted = ref(false)
const hasInteracted = ref(false)
const paymentError = ref<string | null>(null)
const stripeRef = ref<any>(null)
const stripeElementsRef = ref<any>(null)
const paymentElementRef = ref<any>(null)

const getFullName = () => {
  const firstName = props.formAnswers?.firstName || ''
  const lastName = props.formAnswers?.lastName || ''
  return `${firstName} ${lastName}`.trim() || ''
}

const getPhoneNumber = () => {
  // Try both 'phone' and 'phoneNumber' fields from form answers
  return props.formAnswers?.phone || props.formAnswers?.phoneNumber || ''
}

// Test card detection
const TEST_CARD_PATTERNS = [
  /^4242424242424242$/, // Visa
  /^4000000000000002$/, // Visa (declined)
  /^5555555555554444$/, // Mastercard
  /^378282246310005$/, // Amex
  /^6011111111111117$/, // Discover
]

const isTestCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '')
  return TEST_CARD_PATTERNS.some(pattern => pattern.test(cleaned))
}

// Payment confirmation method
const performPayment = async () => {
  if (!stripeRef.value || !stripeElementsRef.value) {
    throw new Error('Stripe not initialized')
  }

  try {
    const result = await stripeRef.value.confirmSetup({
      elements: stripeElementsRef.value,
      redirect: 'if_required',
      confirmParams: {
        payment_method_data: {
          billing_details: {
            email: props.formAnswers?.email,
            phone: getPhoneNumber()
          }
        }
      }
    })

    // Check if setup intent succeeded first, even if there's an error object
    const setupIntent = result?.setupIntent
    if (setupIntent && setupIntent.status === 'succeeded') {
      // Dispatch success event
      const successEvent = new CustomEvent('stripe-confirmation-success', {
        detail: { setupIntent: setupIntent.id }
      })
      window.dispatchEvent(successEvent)

      return {
        stripePaymentId: setupIntent.id
      }
    }

    // Only handle errors if setup intent didn't succeed
    const error = result?.error

    // Check if error object contains a successful setup intent
    const errorSetupIntent = error?.setup_intent
    if (errorSetupIntent && errorSetupIntent.status === 'succeeded') {
      const successEvent = new CustomEvent('stripe-confirmation-success', {
        detail: { setupIntent: errorSetupIntent.id }
      })
      window.dispatchEvent(successEvent)

      return {
        stripePaymentId: errorSetupIntent.id
      }
    }

    if (error) {
      if (error.type === 'validation_error') {
        // Validation errors are handled by Stripe Elements UI
        return null
      }

      // Check for processing errors that might be transient
      const isProcessingError = error.message?.toLowerCase().includes('processing error') ||
        error.message?.toLowerCase().includes('a processing error occurred')

      // Check both the result setup intent and error setup intent
      const intentToCheck = setupIntent || errorSetupIntent
      if (isProcessingError && intentToCheck) {
        // If we have a setup intent, check its status one more time
        // Sometimes Stripe returns processing errors even when the intent succeeds
        if (intentToCheck.status === 'succeeded') {
          const successEvent = new CustomEvent('stripe-confirmation-success', {
            detail: { setupIntent: intentToCheck.id }
          })
          window.dispatchEvent(successEvent)

          return {
            stripePaymentId: intentToCheck.id
          }
        }
      }

      let errorMessage = 'Payment failed. Please try again.'

      if (error.message?.includes('test card') || error.message?.includes('live mode')) {
        errorMessage = 'Test cards are not allowed in production. Please use a real credit card.'
      } else if (error.message?.includes('declined')) {
        errorMessage = 'Your card was declined. Please check your card details and try again.'
      } else if (error.message?.includes('expired')) {
        errorMessage = 'Your card has expired. Please use a different card.'
      } else if (error.message?.includes('CVC')) {
        errorMessage = 'Invalid CVC code. Please check and try again.'
      } else if (error.message && !isProcessingError) {
        errorMessage = error.message
      }

      paymentError.value = errorMessage

      // Dispatch error event
      const errorEvent = new CustomEvent('stripe-confirmation-error', {
        detail: { error: errorMessage }
      })
      window.dispatchEvent(errorEvent)

      throw new Error(errorMessage)
    } else {
      // No error but setup intent didn't succeed
      const errorMessage = 'Payment was not successful. Please try again.'
      paymentError.value = errorMessage

      const errorEvent = new CustomEvent('stripe-confirmation-error', {
        detail: { error: errorMessage }
      })
      window.dispatchEvent(errorEvent)

      throw new Error(errorMessage)
    }
  } catch (err: any) {
    // Only log errors that are actual failures, not processing errors that might resolve
    const errorMessage = err.message || 'Payment failed. Please try again.'

    paymentError.value = errorMessage

    const errorEvent = new CustomEvent('stripe-confirmation-error', {
      detail: { error: errorMessage }
    })
    window.dispatchEvent(errorEvent)

    throw err
  }
}

onMounted(async () => {
  if (!import.meta.client) return

  isMounted.value = true
  initializing.value = true
  error.value = null

  // Set up event listener for payment confirmation
  const handleConfirmSetup = async () => {
    try {
      await performPayment()
    } catch (error) {
      // Error already handled in performPayment
    }
  }

  window.addEventListener('stripe-confirm-setup', handleConfirmSetup)

  // Clean up event listener on unmount
  onUnmounted(() => {
    window.removeEventListener('stripe-confirm-setup', handleConfirmSetup)
  })

  try {
    const { stripePublishableKey } = useEnvMode()
    const stripe = await loadStripe(stripePublishableKey.value)

    if (!stripe || !isMounted.value) {
      throw new Error('Failed to load Stripe')
    }

    const response = await $fetch<{ clientSecret: string }>('/api/create-setup-intent', {
      method: 'POST'
    })

    const stripeClientSecret = response.clientSecret

    if (!isMounted.value) {
      return
    }

    const elements = stripe.elements({
      clientSecret: stripeClientSecret,
      appearance: {
        variables: {
          colorPrimary: '#3b82f6',
          fontSizeBase: '16px', // Prevent iOS zoom on input focus
          spacingUnit: '4px'
        }
      }
    })

    const paymentElement = elements.create('payment', {
      defaultValues: {
        billingDetails: {
          email: props.formAnswers?.email,
          name: getFullName(),
          phone: getPhoneNumber()
        }
      },
      layout: {
        type: 'accordion',
        defaultCollapsed: false,
      }
    })

    paymentElement.on('change', (e: any) => {
      if (!isMounted.value) return

      hasInteracted.value = true
      const isComplete = e.complete
      paymentError.value = e.error ? e.error.message : null

      // Test card detection
      if (isComplete && config.public.nodeEnv === 'production') {
        try {
          const paymentMethod = e.value?.paymentMethod
          if (paymentMethod?.type === 'card') {
            const cardNumber = paymentMethod.card?.number
            if (cardNumber && isTestCard(cardNumber)) {
              paymentError.value = 'Test cards are not allowed in production. Please use a real credit card.'
              emit('payment-update', false)
              return
            }
          }
        } catch (err) {
          // Silent fail
        }
      }

      emit('payment-update', isComplete)
    })

    await nextTick()

    if (!isMounted.value) {
      return
    }

    const paymentElementContainer = document.getElementById('element-payment-only')

    if (!paymentElementContainer) {
      throw new Error('Payment element container not found in DOM')
    }

    paymentElement.mount('#element-payment-only')

    if (isMounted.value) {
      stripeRef.value = stripe
      stripeElementsRef.value = elements
      paymentElementRef.value = paymentElement
    }
  } catch (err: any) {
    console.error('Error initializing Stripe Payment:', err)
    if (isMounted.value) {
      error.value = err.message || 'Failed to load payment form'
    }
  } finally {
    if (isMounted.value) {
      initializing.value = false
    }
  }
})

onUnmounted(() => {
  isMounted.value = false
  if (paymentElementRef.value) {
    try {
      paymentElementRef.value.unmount()
    } catch (e) {
      // Ignore unmount errors
    }
  }
})

// Expose payment method
defineExpose({
  performPayment
})
</script>

<style scoped>
/* Ensure Stripe payment element takes full width */
#element-payment-only {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(#element-payment-only > *) {
  width: 100% !important;
  max-width: 100% !important;
}

/* Target Stripe's internal containers */
:deep(.stripe-element) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.stripe-element iframe),
:deep(.stripe-element [role="group"]) {
  width: 100% !important;
  max-width: 100% !important;
}
</style>

