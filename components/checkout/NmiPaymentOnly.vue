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

    <!-- NMI Collect.js card fields -->
    <div v-show="!initializing" class="w-full space-y-4">
      <!-- Card Number -->
      <div>
        <label class="block text-base font-medium text-gray-700 mb-2">
          Card Number <span class="text-red-500">*</span>
        </label>
        <div id="nmi-ccnumber" class="nmi-field-container"
          :class="{ 'nmi-field-error': cardNumberDirty && !cardNumberValid }"></div>
        <div v-if="cardNumberDirty && !cardNumberValid" class="text-sm text-red-600 mt-2">
          Invalid card number
        </div>
      </div>

      <!-- Expiration + CVV -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-base font-medium text-gray-700 mb-2">
            Expiration <span class="text-red-500">*</span>
          </label>
          <div id="nmi-ccexp" class="nmi-field-container"
            :class="{ 'nmi-field-error': expirationDirty && !expirationValid }"></div>
          <div v-if="expirationDirty && !expirationValid" class="text-sm text-red-600 mt-2">
            Invalid expiration
          </div>
        </div>
        <div>
          <label class="block text-base font-medium text-gray-700 mb-2">
            CVV <span class="text-red-500">*</span>
          </label>
          <div id="nmi-cvv" class="nmi-field-container"
            :class="{ 'nmi-field-error': cvvDirty && !cvvValid }"></div>
          <div v-if="cvvDirty && !cvvValid" class="text-sm text-red-600 mt-2">
            Invalid CVV
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Error Display -->
    <div v-if="paymentError" class="text-sm text-red-600 mt-2">
      {{ paymentError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useNmi } from '~/composables/useNmi'
import { useEnvMode } from '~/composables/useEnvMode'

// Minimal Collect.js typing — the script attaches `CollectJS` to window.
declare global {
  interface Window {
    CollectJS?: {
      configure: (options: any) => void
      startPaymentRequest: () => void
      tokenPromise?: Promise<any>
    }
  }
}

interface Props {
  formAnswers?: any
}

interface Emits {
  // Mirrors StripePaymentOnly so PaymentStep's `handlePaymentUpdate` works
  // unchanged: emits whether the card fields are complete/valid.
  (e: 'payment-update', complete: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const initializing = ref(true)
const error = ref<string | null>(null)
const paymentError = ref<string | null>(null)
const isMounted = ref(false)

// Per-field validity + dirty flags (dirty = user has interacted / Collect.js
// has reported on the field at least once).
const cardNumberValid = ref(false)
const cardNumberDirty = ref(false)
const expirationValid = ref(false)
const expirationDirty = ref(false)
const cvvValid = ref(false)
const cvvDirty = ref(false)

// Pending tokenization promise handlers (set while `performPayment` awaits the
// Collect.js `callback`).
const paymentResolver = ref<((token: string) => void) | null>(null)
const paymentRejector = ref<((reason?: any) => void) | null>(null)

const isPaymentComplete = computed(
  () => cardNumberValid.value && expirationValid.value && cvvValid.value,
)

// Read the tokenization key in onMounted (not setup) so the staging/prod
// selection in useEnvMode() has settled — mirrors the Stripe components.
const { nmiTokenizationKey } = useEnvMode()

/**
 * Tokenizes the entered card via Collect.js and resolves with the resulting
 * single-use NMI payment token. Rejects on validation failure or unmount.
 * Called by the checkout page (via PaymentStep's exposed `nmiPaymentRef`).
 */
const performPayment = (): Promise<string> => {
  // Surface validation errors for any untouched/invalid field.
  cardNumberDirty.value = true
  expirationDirty.value = true
  cvvDirty.value = true

  if (!isPaymentComplete.value) {
    const msg = 'Please complete your card details.'
    paymentError.value = msg
    return Promise.reject(new Error(msg))
  }

  if (!window.CollectJS) {
    const msg = 'Payment system not initialized. Please try again.'
    paymentError.value = msg
    return Promise.reject(new Error(msg))
  }

  return new Promise<string>((resolve, reject) => {
    // Guard against a tokenization that never calls back (mirrors the 15s
    // timeout on the Stripe confirmation path) so the UI never locks.
    const timeout = setTimeout(() => {
      paymentResolver.value = null
      paymentRejector.value = null
      reject(new Error('Card tokenization timed out. Please try again.'))
    }, 20000)

    paymentResolver.value = (token: string) => {
      clearTimeout(timeout)
      resolve(token)
    }
    paymentRejector.value = (reason?: any) => {
      clearTimeout(timeout)
      reject(reason)
    }

    try {
      window.CollectJS?.startPaymentRequest()
    } catch (err: any) {
      clearTimeout(timeout)
      paymentResolver.value = null
      paymentRejector.value = null
      reject(err)
    }
  })
}

onMounted(async () => {
  if (!import.meta.client) return

  isMounted.value = true
  initializing.value = true
  error.value = null

  try {
    const { loadNmiScript } = useNmi(nmiTokenizationKey.value)
    await loadNmiScript()
    await nextTick()

    if (!isMounted.value || !window.CollectJS) {
      throw new Error('Collect.js not available')
    }

    window.CollectJS.configure({
      variant: 'inline',
      styleSniffer: false,
      // Fired whenever a field's validity changes.
      validationCallback: (fieldName: string, valid: boolean) => {
        if (!isMounted.value) return

        switch (fieldName) {
          case 'ccnumber':
            cardNumberValid.value = valid
            cardNumberDirty.value = true
            break
          case 'ccexp':
            expirationValid.value = valid
            expirationDirty.value = true
            break
          case 'cvv':
            cvvValid.value = valid
            cvvDirty.value = true
            break
        }

        emit('payment-update', isPaymentComplete.value)
      },
      // Fired once tokenization succeeds (after startPaymentRequest()).
      callback: (response: any) => {
        if (paymentResolver.value) {
          paymentResolver.value(response.token)
          paymentResolver.value = null
          paymentRejector.value = null
        }
      },
      fields: {
        ccnumber: {
          selector: '#nmi-ccnumber',
          title: 'Card Number',
          placeholder: 'Card Number',
        },
        ccexp: {
          selector: '#nmi-ccexp',
          title: 'Card Expiration',
          placeholder: 'MM / YY',
        },
        cvv: {
          selector: '#nmi-cvv',
          title: 'CVV',
          placeholder: 'CVV',
        },
      },
      customCss: {
        'background-color': '#f9fafb',
        'border': '1px solid #e4e6eb',
        'border-radius': '10px',
        'padding': '12px 16px',
        'font-size': '16px',
        'height': '48px',
      },
      focusCss: {
        'outline': 'none',
        'border-color': '#3b82f6',
        'box-shadow': '0 0 0 2px rgba(59, 130, 246, 0.2)',
      },
      invalidCss: {
        'border-color': '#ef4444',
        'background-color': '#fef2f2',
      },
    })

    // Wait for Collect.js to be ready if it exposes a readiness promise.
    if (window.CollectJS.tokenPromise) {
      await window.CollectJS.tokenPromise
    }
  } catch (err: any) {
    console.error('Error initializing NMI payment:', err)
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
  if (paymentRejector.value) {
    paymentRejector.value(new Error('Component unmounted'))
  }
  paymentResolver.value = null
  paymentRejector.value = null
})

defineExpose({
  performPayment,
})
</script>

<style scoped>
.nmi-field-container {
  @apply min-h-[48px] flex items-center;
}

:deep(iframe) {
  display: block;
  width: 100%;
  height: 48px;
  border: none;
}
</style>
