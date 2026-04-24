<template>
  <div class="w-full">
    <!-- Loading state -->
    <div v-if="initializing" class="text-sm text-gray-600 mb-4">
      <div>Setting up payment options...</div>
    </div>

    <!-- Error message -->
    <div v-if="error" class="text-sm text-red-600 mb-4">
      {{ error }}
    </div>

    <!-- Payment Element -->
    <div id="element-bnpl-payment" class="w-full form-input min-h-[60px] py-6 flex items-center stripe-element"
      :class="{ 'interacted': hasInteracted }">
      <span class="text-gray-500">Loading payment options...</span>
    </div>

    <!-- Payment Error Display -->
    <div v-if="paymentError" class="text-sm text-red-600 mt-2">
      {{ paymentError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { loadStripe } from '@stripe/stripe-js'

interface Props {
  formAnswers?: any
  amount: number // Required: amount in dollars for PaymentIntent
  shippingAddress?: {
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    country: string
    postalCode: string
  } | null
}

interface Emits {
  (e: 'payment-update', complete: boolean): void
  (e: 'payment-success', paymentIntentId: string): void
  (e: 'payment-error', error: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const initializing = ref(true)
const error = ref<string | null>(null)
const isMounted = ref(false)
const hasInteracted = ref(false)
const paymentError = ref<string | null>(null)
const stripeRef = ref<any>(null)
const stripeElementsRef = ref<any>(null)
const paymentElementRef = ref<any>(null)
const clientSecretRef = ref<string | null>(null)

const getFullName = () => {
  const firstName = props.formAnswers?.firstName || ''
  const lastName = props.formAnswers?.lastName || ''
  return `${firstName} ${lastName}`.trim() || ''
}

const getPhoneNumber = () => {
  // Try both 'phone' and 'phoneNumber' fields from form answers
  return props.formAnswers?.phone || props.formAnswers?.phoneNumber || ''
}

// CRITICAL: Payment confirmation function
const performPayment = async () => {
  if (!stripeRef.value || !stripeElementsRef.value) {
    throw new Error('Stripe not initialized')
  }

  try {
    
    // Store checkout query params before redirect
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href)
      const queryParams: Record<string, string> = {}
      currentUrl.searchParams.forEach((value, key) => {
        queryParams[key] = value
      })
      sessionStorage.setItem('checkout_query_params', JSON.stringify(queryParams))
    }

    // CRITICAL: Update checkout data with current shipping address before redirect
    // This ensures we have the latest address for form submission after BNPL return
    if (typeof window !== 'undefined' && props.shippingAddress) {
      const step1Data = localStorage.getItem('checkout_step1_data')
      if (step1Data) {
        try {
          const checkoutData = JSON.parse(step1Data)
          checkoutData.paymentInfo = {
            ...checkoutData.paymentInfo,
            shippingAddress: props.shippingAddress
          }
          localStorage.setItem('checkout_step1_data', JSON.stringify(checkoutData))
        } catch (e) {
          console.error('❌ Could not update checkout data with address:', e)
        }
      }
    }

    // Confirm payment with Stripe
    const result = await stripeRef.value.confirmPayment({
      elements: stripeElementsRef.value,
      confirmParams: {
        return_url: `${window.location.origin}/checkout`,
        payment_method_data: {
          billing_details: {
            email: props.formAnswers?.email,
            name: getFullName(),
            phone: getPhoneNumber(),
            address: props.shippingAddress ? {
              line1: props.shippingAddress.addressLine1,
              line2: props.shippingAddress.addressLine2 || undefined,
              city: props.shippingAddress.city,
              state: props.shippingAddress.state,
              postal_code: props.shippingAddress.postalCode,
              country: props.shippingAddress.country || 'US'
            } : undefined
          }
        }
      },
      redirect: 'if_required' // IMPORTANT: Allow redirects to BNPL provider
    })


    const paymentIntent = result?.paymentIntent

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      // Success - dispatch custom event
      const successEvent = new CustomEvent('stripe-bnpl-confirmation-success', {
        detail: { paymentIntent: paymentIntent.id }
      })
      window.dispatchEvent(successEvent)
      emit('payment-success', paymentIntent.id)
      return {
        stripePaymentId: paymentIntent.id
      }
    }

    // Handle errors
    const paymentError_result = result?.error

    if (paymentError_result) {
      if (paymentError_result.type === 'validation_error') {
        console.warn('⚠️ Validation error, user needs to fix form')
        return null
      }

      let errorMessage = 'Payment failed. Please try again.'
      if (paymentError_result.message?.includes('declined')) {
        errorMessage = 'Your payment was declined. Please try a different payment method.'
      } else if (paymentError_result.message) {
        errorMessage = paymentError_result.message
      }

      console.error('❌ Payment error:', errorMessage)
      paymentError.value = errorMessage
      emit('payment-error', errorMessage)
      
      const errorEvent = new CustomEvent('stripe-bnpl-confirmation-error', {
        detail: { error: errorMessage }
      })
      window.dispatchEvent(errorEvent)
      throw new Error(errorMessage)
    } else {
      const errorMessage = 'Payment was not successful. Please try again.'
      console.error('❌ Payment not successful')
      paymentError.value = errorMessage
      emit('payment-error', errorMessage)
      
      const errorEvent = new CustomEvent('stripe-bnpl-confirmation-error', {
        detail: { error: errorMessage }
      })
      window.dispatchEvent(errorEvent)
      throw new Error(errorMessage)
    }
  } catch (err: any) {
    const errorMessage = err.message || 'Payment failed. Please try again.'
    console.error('❌ Exception during payment:', err)
    paymentError.value = errorMessage
    emit('payment-error', errorMessage)
    
    const errorEvent = new CustomEvent('stripe-bnpl-confirmation-error', {
      detail: { error: errorMessage }
    })
    window.dispatchEvent(errorEvent)
    throw err
  }
}

// Initialize Stripe and create payment element
const initializeStripe = async () => {
  if (!import.meta.client) return

  if (!props.amount || props.amount < 1) {
    error.value = 'Invalid amount for payment'
    initializing.value = false
    return
  }

  isMounted.value = true
  initializing.value = true
  error.value = null

  try {
    const config = useRuntimeConfig()
    const stripe = await loadStripe(config.public.stripePublishableKey)

    if (!stripe || !isMounted.value) {
      throw new Error('Failed to load Stripe')
    }


    // CRITICAL: Create PaymentIntent via backend API
    const response = await $fetch<{ clientSecret: string }>('/api/create-payment-intent', {
      method: 'POST',
      body: {
        amount: props.amount,
        paymentMethodTypes: ['affirm', 'klarna', 'afterpay_clearpay'] // BNPL methods
      }
    })

    const stripeClientSecret = response.clientSecret
    clientSecretRef.value = stripeClientSecret

    if (!isMounted.value) {
      return
    }

    // Create Stripe Elements with PaymentIntent client secret
    const elements = stripe.elements({
      clientSecret: stripeClientSecret,
      appearance: {
        variables: {
          colorPrimary: '#1612d3', // Your brand color
          fontSizeBase: '16px', // Prevent iOS zoom on input focus
          spacingUnit: '4px'
        }
      }
    })

    // Create Payment Element with BNPL methods
    const paymentElement = elements.create('payment', {
      layout: 'tabs', // Show BNPL options as tabs
      paymentMethodOrder: ['affirm', 'klarna', 'afterpay_clearpay'], // Order of display
      defaultValues: {
        billingDetails: {
          email: props.formAnswers?.email,
          name: getFullName(),
          phone: getPhoneNumber()
        }
      }
    })

    // Listen for changes
    paymentElement.on('change', (e: any) => {
      if (!isMounted.value) return
      
      hasInteracted.value = true
      const isComplete = e.complete
      paymentError.value = e.error ? e.error.message : null
      
      emit('payment-update', isComplete)
    })

    await nextTick()

    if (!isMounted.value) {
      return
    }

    // Mount the element to DOM
    const paymentElementContainer = document.getElementById('element-bnpl-payment')
    if (!paymentElementContainer) {
      throw new Error('BNPL payment element container not found in DOM')
    }

    paymentElement.mount('#element-bnpl-payment')

    if (isMounted.value) {
      stripeRef.value = stripe
      stripeElementsRef.value = elements
      paymentElementRef.value = paymentElement
    }
  } catch (err: any) {
    console.error('❌ Error initializing Stripe BNPL Payment:', err)
    if (isMounted.value) {
      error.value = err.message || 'Failed to load payment options'
    }
  } finally {
    if (isMounted.value) {
      initializing.value = false
    }
  }
}

onMounted(async () => {
  
  // CRITICAL: Listen for confirmation event from parent
  const handleConfirmBNPL = async () => {
    try {
      await performPayment()
    } catch (error) {
      // Error already handled in performPayment
    }
  }

  window.addEventListener('stripe-confirm-bnpl', handleConfirmBNPL)

  onUnmounted(() => {
    window.removeEventListener('stripe-confirm-bnpl', handleConfirmBNPL)
  })

  await initializeStripe()
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

// Watch for amount changes and reinitialize
watch(() => props.amount, async (newAmount, oldAmount) => {
  if (newAmount !== oldAmount && newAmount > 0 && isMounted.value) {
    if (paymentElementRef.value) {
      try {
        paymentElementRef.value.unmount()
      } catch (e) {
        // Ignore unmount errors
      }
    }
    await initializeStripe()
  }
})

defineExpose({
  performPayment
})
</script>

<style scoped>
/* Ensure Stripe BNPL payment element takes full width */
#element-bnpl-payment {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(#element-bnpl-payment > *) {
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

