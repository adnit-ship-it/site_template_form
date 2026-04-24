<template>
  <div>
    <div
      id="element-payment-only"
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
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { loadStripe } from '@stripe/stripe-js'

interface AddressInfo {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
}

interface Props {
  formAnswers?: any
}

interface Emits {
  (e: 'payment-update', data: { stripeSetupId: string | null; shippingAddress: AddressInfo | null } | null | undefined): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isMounted = ref(false)
const hasInteracted = ref(false)
const isPaymentComplete = ref(false)
const paymentError = ref<string | null>(null)
const stripeRef = ref<any>(null)
const paymentElementRef = ref<any>(null)
const elementsRef = ref<any>(null)

const getFullName = () => {
  const firstName = props.formAnswers?.firstName || ''
  const lastName = props.formAnswers?.lastName || ''
  return `${firstName} ${lastName}`.trim()
}

onMounted(async () => {
  isMounted.value = true

  try {
    const config = useRuntimeConfig()
    const stripe = await loadStripe(config.public.stripePublishableKey)
    
    if (!stripe || !isMounted.value) {
      throw new Error('Failed to load Stripe')
    }
    
    stripeRef.value = stripe
    
    // Create SetupIntent
    const response = await $fetch<{ clientSecret: string }>(
      "/api/create-setup-intent",
      {
        method: "POST",
      }
    )
    
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
    
    elementsRef.value = elements
    
    const paymentElement = elements.create('payment', {
      defaultValues: {
        billingDetails: { 
          email: props.formAnswers?.email, 
          name: getFullName() 
        }
      }
    })
    
    paymentElementRef.value = paymentElement
    
    paymentElement.on('change', (e: any) => {
      if (!isMounted.value) return
      
      hasInteracted.value = true
      isPaymentComplete.value = e.complete
      paymentError.value = e.error ? e.error.message : null
      
      // Emit payment update
      if (isPaymentComplete.value) {
        emit('payment-update', {
          stripeSetupId: 'ready',
          shippingAddress: null
        })
      } else {
        emit('payment-update', {
          stripeSetupId: null,
          shippingAddress: null
        })
      }
    })
    
    await nextTick()
    
    if (isMounted.value) {
      const paymentContainer = document.getElementById('element-payment-only')
      if (paymentContainer) {
        paymentElement.mount('#element-payment-only')
      }
    }
  } catch (error) {
    console.error('Error initializing Stripe payment:', error)
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
</script>

<style scoped>
:deep(#element-payment-only) {
  width: 100% !important;
}

:deep(#element-payment-only > *) {
  width: 100% !important;
}
</style>

