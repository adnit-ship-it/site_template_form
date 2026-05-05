<template>
  <div class="w-full">
    <!-- Error message -->
    <div v-if="error" class="text-sm text-red-600 mb-4">
      {{ error }}
    </div>
    <!-- Skeleton loader -->
    <div v-if="initializing" class="w-full space-y-4 animate-pulse">
      <div>
        <div class="h-3 w-20 bg-gray-200 rounded mb-2"></div>
        <div class="h-11 w-full bg-gray-200 rounded"></div>
      </div>
      <div>
        <div class="h-3 w-28 bg-gray-200 rounded mb-2"></div>
        <div class="h-11 w-full bg-gray-200 rounded"></div>
      </div>
      <div>
        <div class="h-3 w-14 bg-gray-200 rounded mb-2"></div>
        <div class="h-11 w-full bg-gray-200 rounded"></div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="h-3 w-10 bg-gray-200 rounded mb-2"></div>
          <div class="h-11 w-full bg-gray-200 rounded"></div>
        </div>
        <div>
          <div class="h-3 w-16 bg-gray-200 rounded mb-2"></div>
          <div class="h-11 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="h-3 w-12 bg-gray-200 rounded mb-2"></div>
          <div class="h-11 w-full bg-gray-200 rounded"></div>
        </div>
        <div>
          <div class="h-3 w-20 bg-gray-200 rounded mb-2"></div>
          <div class="h-11 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <!-- Stripe Address Element -->
    <div
      id="element-address-only"
      class="w-full form-input min-h-[60px] py-6 flex items-center stripe-element"
      :class="[initializing ? 'invisible absolute pointer-events-none' : '', { 'interacted': hasInteracted }]"
    ></div>
    <!-- PO Box validation error -->
    <div v-if="poBoxError" class="flex items-start gap-2 mt-3 text-sm text-red-600">
      <svg class="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ poBoxError }}
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
  (e: 'address-update', address: AddressInfo | null, complete: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const PO_BOX_REGEX = /\b(?:p\.?\s*o\.?\s*(?:box|b\.?)|post\s+office\s+box)\b/i

const initializing = ref(true)
const error = ref<string | null>(null)
const poBoxError = ref<string | null>(null)
const isMounted = ref(false)
const hasInteracted = ref(false)
const stripeRef = ref<any>(null)
const stripeElementsRef = ref<any>(null)
const addressElementRef = ref<any>(null)
const shippingAddress = ref<AddressInfo | null>(null)

const getFullName = () => {
  const firstName = props.formAnswers?.firstName || ''
  const lastName = props.formAnswers?.lastName || ''
  return `${firstName} ${lastName}`.trim() || ''
}

const getPhoneNumber = () => {
  // Try both 'phone' and 'phoneNumber' fields from form answers
  return props.formAnswers?.phone || props.formAnswers?.phoneNumber || ''
}

onMounted(async () => {
  if (!import.meta.client) return

  isMounted.value = true
  initializing.value = true
  error.value = null

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

    const addressElement = elements.create('address', {
      mode: 'shipping',
      allowedCountries: ['US'],
      fields: {
        phone: 'always' // Always show phone field
      },
      defaultValues: {
        name: getFullName(),
        phone: getPhoneNumber()
      }
    })

    addressElement.on('change', (e: any) => {
      if (!isMounted.value) return

      hasInteracted.value = true
      const isComplete = e.complete
      const addr = e.value?.address

      const line1 = addr?.line1 || ''
      const line2 = addr?.line2 || ''
      if (PO_BOX_REGEX.test(line1) || PO_BOX_REGEX.test(line2)) {
        poBoxError.value = 'We cannot ship to PO Boxes. Please enter a physical street address.'
        shippingAddress.value = null
        emit('address-update', null, false)
        return
      }

      poBoxError.value = null

      if (isComplete && addr) {
        shippingAddress.value = {
          addressLine1: line1,
          addressLine2: line2,
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || 'US',
          postalCode: addr.postal_code || ''
        }
        emit('address-update', shippingAddress.value, true)
      } else {
        shippingAddress.value = null
        emit('address-update', null, false)
      }
    })

    await nextTick()

    if (!isMounted.value) {
      return
    }

    const addressElementContainer = document.getElementById('element-address-only')

    if (!addressElementContainer) {
      throw new Error('Address element container not found in DOM')
    }

    addressElement.mount('#element-address-only')

    if (isMounted.value) {
      stripeRef.value = stripe
      stripeElementsRef.value = elements
      addressElementRef.value = addressElement
    }
  } catch (err: any) {
    console.error('Error initializing Stripe Address:', err)
    if (isMounted.value) {
      error.value = err.message || 'Failed to load address form'
    }
  } finally {
    if (isMounted.value) {
      initializing.value = false
    }
  }
})

// Method to get current address from Stripe element
const getCurrentAddress = async (): Promise<AddressInfo | null> => {
  if (!addressElementRef.value || !isMounted.value) {
    return shippingAddress.value
  }

  try {
    // Get the current value from the Stripe address element
    const value = await addressElementRef.value.getValue()
    if (value?.complete && value?.value?.address) {
      const addr = value.value.address
      const address = {
        addressLine1: addr.line1 || '',
        addressLine2: addr.line2 || '',
        city: addr.city || '',
        state: addr.state || '',
        country: addr.country || 'US',
        postalCode: addr.postal_code || ''
      }
      return address
    } else {
      console.warn('⚠️ Stripe element value not complete or missing address')
    }
  } catch (e) {
    // If getValue fails, return the cached address
    console.warn('❌ Could not get address from Stripe element:', e)
  }
  return shippingAddress.value
}

onUnmounted(() => {
  isMounted.value = false
  if (addressElementRef.value) {
    try {
      addressElementRef.value.unmount()
    } catch (e) {
      // Ignore unmount errors
    }
  }
})

defineExpose({
  getCurrentAddress
})
</script>

<style scoped>
/* Ensure Stripe address element takes full width */
#element-address-only {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(#element-address-only > *) {
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

