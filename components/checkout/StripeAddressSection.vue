<template>
  <div>
    <div
      id="element-address-only"
      class="form-input min-h-[60px] py-6 flex items-center stripe-element"
      :class="{ 'interacted': hasInteracted }"
    >
      <span class="text-gray-500">Loading address field...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import MexicoAddressForm from '~/components/form/inputs/MexicoAddressForm.vue'

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
  shipToMexico?: boolean
}

interface Emits {
  (e: 'address-update', address: AddressInfo | null, complete: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isMounted = ref(false)
const hasInteracted = ref(false)
const isAddressComplete = ref(false)
const shippingAddress = ref<AddressInfo | null>(null)
const stripeRef = ref<any>(null)
const addressElementRef = ref<any>(null)
const elementsRef = ref<any>(null)

const getFullName = () => {
  const firstName = props.formAnswers?.firstName || ''
  const lastName = props.formAnswers?.lastName || ''
  return `${firstName} ${lastName}`.trim()
}

const shouldShowMexicoForm = computed(() => {
  return props.shipToMexico === true
})

const mexicoAddress = ref<any>(null)

const handleMexicoAddressUpdate = (address: any) => {
  mexicoAddress.value = address
  shippingAddress.value = address
  hasInteracted.value = true
  
  const isMexicoAddressComplete = address && 
    address.addressLine1 && address.addressLine1.trim() !== '' &&
    address.addressLine2 && address.addressLine2.trim() !== '' &&
    address.city && address.city.trim() !== '' &&
    address.state && address.state.trim() !== '' &&
    address.postalCode && address.postalCode.trim() !== '' &&
    address.postalCode.match(/^\d{5}$/)
  
  isAddressComplete.value = isMexicoAddressComplete
  emit('address-update', shippingAddress.value, isAddressComplete.value)
}

// Method to get current address
const getCurrentAddress = async (): Promise<AddressInfo | null> => {
  if (addressElementRef.value) {
    try {
      const value = await addressElementRef.value.getValue()
      if (value?.address) {
        return {
          addressLine1: value.address.line1 || '',
          addressLine2: value.address.line2 || '',
          city: value.address.city || '',
          state: value.address.state || '',
          country: value.address.country || 'US',
          postalCode: value.address.postal_code || '',
        }
      }
    } catch (e) {
      console.warn('Error getting address:', e)
    }
  }
  return shippingAddress.value
}

onMounted(async () => {
  isMounted.value = true

  if (shouldShowMexicoForm.value) {
    return
  }

  try {
    const { stripePublishableKey } = useEnvMode()
    const stripe = await loadStripe(stripePublishableKey.value)
    
    if (!stripe || !isMounted.value) {
      throw new Error('Failed to load Stripe')
    }
    
    stripeRef.value = stripe
    
    // Create SetupIntent for address element
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
    
    const addressElement = elements.create('address', {
      mode: 'shipping',
      allowedCountries: ['US'],
      defaultValues: { 
        name: getFullName() 
      }
    })
    
    addressElementRef.value = addressElement
    
    addressElement.on('change', (e: any) => {
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
      
      emit('address-update', shippingAddress.value, isAddressComplete.value)
    })
    
    await nextTick()
    
    if (isMounted.value) {
      const addressContainer = document.getElementById('element-address-only')
      if (addressContainer) {
        addressElement.mount('#element-address-only')
      }
    }
  } catch (error) {
    console.error('Error initializing Stripe address:', error)
  }
})

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
:deep(#element-address-only) {
  width: 100% !important;
}

:deep(#element-address-only > *) {
  width: 100% !important;
}
</style>

