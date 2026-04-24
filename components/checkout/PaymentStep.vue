<template>
  <div class="relative">
    <!-- Processing Overlay -->
    <div v-if="props.isSubmitting"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div class="bg-white p-4 md:p-8 max-w-md mx-4 rounded-2xl text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accentColor1 mx-auto mb-4"></div>
        <h3 class="text-xl font-bold text-bodyColor mb-2">Processing Payment</h3>
        <p class="text-bodyColor">Please wait while we process your payment...</p>
      </div>
    </div>

    <!-- Back Button -->
    <button @click="handleBack" type="button"
      class="mb-4 top-6 min-[374px]:top-5 z-50 lg:top-0 left-1 h-6 lg:w-10 lg:h-10 w-6 min-[374px]:left-4 lg:left-0 lg:mb-0 flex items-center fixed lg:static justify-center min-[374px]:w-8 min-[374px]:h-8 rounded-full bg-white hover:bg-gray-50 transition-colors"
      aria-label="Go back">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 min-[374px]:w-6 min-[374px]:h-6 text-bodyColor" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Treatment Details Card - Top Section -->
    <div class="max-w-[726px] mx-auto mb-8 lg:-mt-10">
      <div class="bg-[#01cd8b]/10 rounded-2xl lg:rounded-[28px] p-4 lg:py-8 lg:px-12">
        <h2 class="text-xl md:text-2xl font-bold text-bodyColor mb-6 text-center">Your Treatment Details</h2>

        <!-- Product Info -->
        <div v-if="selectedProduct" class="flex gap-2 md:flex-row flex-col items-center lg:gap-4 md:gap-6 mb-6">
          <!-- Product Image -->
          <div class="w-[154px] h-[154px] rounded-xl overflow-hidden bg-[#e4ecf7] pb-0 hidden md:block">
            <img :src="selectedProduct.images.mainImg" :alt="selectedProduct.name"
              class="w-full h-full object-cover" loading="lazy" />
          </div>

          <div class="w-full h-[154px] rounded-xl overflow-hidden  pb-0 block md:hidden">
            <img :src="selectedProduct.images.mainImg"
              :alt="selectedProduct.name" class="w-auto h-full object-cover rounded-xl" loading="lazy" />
          </div>

          <!-- Details List -->
          <div class="flex-1 bg-[#75af9c]/30 rounded-[28px] p-4 md:p-6 w-full md:w-auto">
            <div class="flex flex-col gap-2 text-[13px] lg:text-base">
              <div class="flex justify-between items-center">
                <p class="text-[#4a5565]">Medication:</p>
                <p class="font-semibold text-[#4a5565] text-xs min-[372px]:text-[13px]">{{
                  getMedicationName(selectedProduct) }}</p>
              </div>
              <div class="flex justify-between items-center">
                <p class="text-[#4a5565]">Delivery Plan:</p>
                <p class="font-semibold text-[#4a5565]">{{ getFrequencyName(selectedPlan) }}</p>
              </div>
              <div class="flex justify-between items-center">
                <p class="text-[#4a5565]">Shipping:</p>
                <p class="font-semibold text-[#00cc3c]">FREE</p>
              </div>
              <div v-if="promoDiscount > 0" class="flex justify-between items-center">
                <p class="text-[#4a5565]">Discount:</p>
                <p class="font-semibold text-[#00cc3c]">-${{ promoDiscount }}</p>
              </div>
              <div class="flex justify-between items-center">
                <p class="text-[#4a5565]">Total Savings:</p>
                <p class="font-semibold text-[#00cc3c]">${{ formatTotalSavings() }}</p>
              </div>
              <div class="flex justify-between items-center border-t border-bodyColor/20 pt-2">
                <p class="text-[#4a5565]">Monthly Price:</p>
                <p class="font-semibold text-[#00cc3c] text-sm lg:text-xl">
                  <span v-if="currentRefillPrice" class="line-through font-normal text-bodyColor/50 mr-2">${{
                    currentRefillPrice }}</span>
                  ${{ formatPrice(getDiscountedMonthlyPrice()) }}
                </p>
              </div>
              <div class="flex justify-between items-center">
                <p class="text-[#4a5565] text-sm lg:text-xl font-semibold">Total if prescribed:</p>
                <p class="font-bold text-[#4a5565] text-sm lg:text-xl">
                  <span v-if="getOldTotalPrice()" class="line-through font-normal text-bodyColor/50 mr-1 lg:mr-2">${{
                    formatPrice(getOldTotalPrice() || 0) }}</span>
                  ${{ formatPrice(getDiscountedTotalPrice()) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Savings Text -->
        <p class="text-center text-sm md:text-base text-[#4a5565] mb-4">
          You are saving <span class="font-bold mr-0">${{ formatTotalSavings() }}</span>
          <span v-if="selectedPlan !== 'monthly'"> vs monthly </span> with your exclusive plan<span
            v-if="promoDiscount > 0">, 2 discounts applied</span>
        </p>

        <!-- Promo Code Banner -->
        <div ref="promoCodeBannerRef" @click="promoInputRef?.focus()"
          class="bg-accentColor1 rounded-[12px] py-3 px-4 flex items-center justify-center gap-2 cursor-text">
          <img src="/assets/images/icons/pricetag.svg" alt="Promo" class="h-5 w-5 flex-shrink-0" />
          <span class="text-white font-semibold text-sm md:text-base whitespace-nowrap flex-shrink-0">
            <template v-if="isPromoApplied && promoCode">
              CODE APPLIED:
            </template>
            <template v-else>ENTER CODE</template>
          </span>
          <input
            ref="promoInputRef"
            v-model="promoCode"
            @blur="handlePromoBlur"
            type="text"
            class="bg-transparent border-b border-white text-white font-semibold text-sm md:text-base w-full max-w-[240px] focus:outline-none py-0.5"
          />
        </div>

        <!-- Benefits -->
        <p class="text-center text-xs md:text-sm text-[#4a5565] my-4">
          Same Price. All Dosage Levels.<br>
          Prescribed & shipped within 3-5 days
        </p>

        <!-- $0 Due Today Banner -->
        <div class="bg-[#01cd8b] text-[black] text-center py-3 px-4 rounded mb-4">
          <p class="text-lg md:text-xl font-bold">$0 Due Today!</p>
          <p class="text-sm">Only charged if your prescription is approved.</p>
        </div>

        <!-- HSA/FSA Badge -->
        <div class="flex items-center justify-center gap-2 bg-white rounded p-4">
          <img src="/assets/images/icons/hsafsa.png" alt="HSA/FSA" class="h-8 w-auto object-contain" loading="lazy" />
        </div>
      </div>
    </div>

    <!-- Payment Section -->
    <div class="max-w-[726px] mx-auto">
      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-xl md:text-2xl font-bold text-bodyColor mb-2">Choose Payment Method</h2>
        <p class="text-sm text-bodyColor/70">Your data is protected by HIPAA. All transactions are secured and
          encrypted.</p>
      </div>

      <!-- Payment Method Toggle (only when BNPL is available, i.e. multi-month plans) -->
      <div v-if="bnplActivated && selectedPlan !== 'monthly'" class="bg-[#e9ecf0] rounded-xl p-2.5 mb-6">
        <div class="grid grid-cols-2 gap-4">
          <!-- Card & Wallets -->
          <button @click="paymentMethodType = 'card'"
            :class="paymentMethodType === 'card' ? 'bg-white' : 'bg-transparent'"
            class="rounded-lg sm:p-4 p-1.5 text-center transition-all">
            <h3
              class="sm:text-base min-[424px]:-translate-y-6 min-[426px]:translate-y-0 text-xs min-[372px]:text-sm !font-bold text-bodyColor mb-3">
              Card & Wallets</h3>
            <div class="flex items-center flex-wrap justify-center gap-2">
              <img src="/assets/images/icons/card.png" alt="Card" class="h-5 w-auto object-contain" />
              <img src="/assets/images/icons/applepay.png" alt="Apple Pay" class="h-5 w-auto object-contain" />
              <img src="/assets/images/icons/gpay.png" alt="Google Pay" class="h-5 w-auto object-contain" />
            </div>
          </button>

          <!-- Buy Now, Pay Later -->
          <button @click="paymentMethodType = 'bnpl'"
            :class="paymentMethodType === 'bnpl' ? 'bg-white' : 'bg-transparent'"
            class="rounded-lg sm:p-4 p-1.5 text-center transition-all">
            <h3 class="sm:text-base text-xs min-[372px]:text-sm !font-bold text-bodyColor mb-3">Buy Now, Pay Later</h3>
            <div class="flex items-center flex-wrap justify-center gap-2">
              <img src="/assets/images/icons/affirm-lg.png" alt="Affirm"
                class="min-[372px]:h-5 h-4 w-auto object-contain" />
              <img src="/assets/images/icons/klarna-lg.png" alt="Klarna"
                class="min-[372px]:h-5 h-4 w-auto object-contain" />
              <img src="/assets/images/icons/afterpay-lg.png" alt="Afterpay" class="h-5 w-auto object-contain" />
            </div>
          </button>

        </div>
      </div>

      <!-- Shipping Address -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-bodyColor mb-3">Shipping Address</h3>
        <div class="bg-white border rounded-[8px] border-[#d9d9d9] p-4 md:p-6">
          <div v-if="isStripeLoaded" class="w-full">
            <StripeAddressOnly ref="stripeAddressRef" :form-answers="formAnswers"
              @address-update="handleAddressUpdate" />
          </div>
          <div v-else class="text-center py-8">
            <div class="text-gray-500">Loading address field...</div>
          </div>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-bodyColor mb-3">Payment Method</h3>
        <div class="bg-white border rounded-[8px] border-[#d9d9d9] p-4 md:p-6">
          <!-- Card Payment (only mount when selected, requires Stripe) -->
          <div v-if="isStripeLoaded && paymentMethodType === 'card'" class="w-full">
            <StripePaymentOnly :key="paymentElementKey" ref="stripePaymentRef" :form-answers="formAnswers"
              @payment-update="handlePaymentUpdate" />
          </div>

          <!-- BNPL Payment (only mount when selected, requires Stripe) -->
          <div v-if="isStripeLoaded && paymentMethodType === 'bnpl'" class="w-full">
            <StripeBNPLPayment ref="stripeBNPLRef" :form-answers="formAnswers" :amount="calculatedPrice"
              :shipping-address="shippingAddress" @payment-update="handleBNPLUpdate"
              @payment-success="handleBNPLSuccess" @payment-error="handleBNPLError" />
          </div>

          <!-- Loading State -->
          <div v-if="!isStripeLoaded && (paymentMethodType === 'card' || paymentMethodType === 'bnpl')"
            class="text-center py-8">
            <div class="text-gray-500">Loading payment field...</div>
          </div>
        </div>
      </div>

      <!-- Consent Checkbox -->
      <div class="mb-6">
        <label class="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" v-model="consentChecked"
            class="mt-1 w-4 h-4 text-accentColor1 border-gray-300 rounded focus:ring-accentColor1 flex-shrink-0" />
          <span class="text-sm text-bodyColor/70" v-html="consentText"></span>
        </label>
      </div>

      <!-- Submit Button -->
      <button @click="handleSubmit" :disabled="!canSubmit || props.isSubmitting || isSubmittingLocal"
        class="w-[95%] mx-4 bg-accentColor1 text-white py-4 px-6 rounded-lg font-bold text-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accentColor1/90 mb-4">
        {{ (props.isSubmitting || isSubmittingLocal) ? 'Processing...' : 'Continue→' }}
      </button>

      <!-- CareValidate -->
      <div class="mb-6">
        <div class="bg-white border rounded-[8px] border-[#d9d9d9] p-4 md:p-6">
          <div class="flex-col gap-4 items-start mb-4">
            <div class="flex gap-4 items-start justify-between">
              <h3 class="text-lg font-bold text-bodyColor mb-2">Powered by CareValidate</h3>
              <img src="/assets/images/carevalidate.png" alt="CareValidate" class="h-[36px] flex-shrink-0"
                loading="lazy" />
            </div>
            <div class="flex-1">
              <p class="text-sm text-bodyColor">
                To ensure the highest level of care, we've partnered with Care Validate for certain aspects of your
                experience. You may see their name on payment
                portals, but rest assured, {{ orgName }} remains your primary service provider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { Category, Product, PlanType } from '~/types/checkout'
import { getVariationPrice, getVariationRefillPrice, getVariationId } from '~/types/checkout'
import StripeAddressOnly from '~/components/checkout/StripeAddressOnly.vue'
import StripePaymentOnly from '~/components/checkout/StripePaymentOnly.vue'
import StripeBNPLPayment from '~/components/checkout/StripeBNPLPayment.vue'

interface AddressInfo {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
}

interface Props {
  selectedCategory: Category | null
  selectedProduct: Product | null
  selectedPlan: PlanType
  paymentData: { stripeSetupId?: string | null; stripePaymentIntentId?: string | null; paymentType?: 'card' | 'bnpl'; shippingAddress: AddressInfo | null } | undefined
  isStripeLoaded: boolean
  formAnswers: any
  isSubmitting?: boolean
  shipToMexico?: boolean
}

interface Emits {
  (e: 'payment-update', data: { stripeSetupId: string | null; shippingAddress: AddressInfo | null } | null | undefined): void
  (e: 'back'): void
  (e: 'submit'): void
  (e: 'update-consent', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const runtimeCfg = useRuntimeConfig().public
const orgName = (runtimeCfg.orgName as string) || 'The Hormone Experts'
const bnplActivated = runtimeCfg.bnplActivated as boolean

const stripeAddressRef = ref()
const stripePaymentRef = ref()
const stripeBNPLRef = ref()
const paymentElementKey = ref(0)
const promoCode = ref('')
const promoCodeBannerRef = ref<HTMLDivElement>()
const promoInputRef = ref<HTMLInputElement>()
const isPromoApplied = ref(false)
const isAddressComplete = ref(false)
const isPaymentComplete = ref(false)
const isBNPLComplete = ref(false)
const shippingAddress = ref<AddressInfo | null>(null)
const isSubmittingLocal = ref(false)
const paymentMethodType = ref<'card' | 'bnpl'>('card')
const consentChecked = ref(true) // Checked by default

// Countdown Timer Logic
const timeRemaining = ref(420) // 7 minutes in seconds (7:00)
const countdownInterval = ref<number | null>(null)

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const startCountdown = () => {
  if (typeof window === 'undefined') return

  if (countdownInterval.value) {
    window.clearInterval(countdownInterval.value)
  }

  countdownInterval.value = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      if (countdownInterval.value) {
        window.clearInterval(countdownInterval.value)
        countdownInterval.value = null
      }
    }
  }, 1000)
}

const stopCountdown = () => {
  if (typeof window === 'undefined') return

  if (countdownInterval.value) {
    window.clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
}

// Consent text
const consentText = "I confirm that I am the patient completing this intake form and have reviewed all questions carefully. I attest that my answers are true, accurate, and complete to the best of my knowledge. I understand the importance of providing my doctor with complete and accurate health information for my care. I agree with the Terms of Service and Privacy Policy."

// Computed property to get fullName from firstName and lastName
const fullName = computed(() => {
  const firstName = props.formAnswers?.firstName || ''
  const lastName = props.formAnswers?.lastName || ''
  return `${firstName} ${lastName}`.trim() || ''
})

// Calculate price based on selected plan
const calculatedPrice = computed(() => {
  if (!props.selectedProduct) {
    return 0
  }
  const plan = props.selectedPlan || 'monthly'
  let price = 0
  if (plan === 'threeMonthly') {
    price = getVariationPrice(props.selectedProduct, 'threeMonthly') || 0
  } else if (plan === 'sixMonthly') {
    price = getVariationPrice(props.selectedProduct, 'sixMonthly') || 0
  } else if (plan === 'yearly') {
    price = getVariationPrice(props.selectedProduct, 'yearly') || 0
  } else {
    price = getVariationPrice(props.selectedProduct, 'monthly') || 0
  }
  return price
})

const promoDiscount = ref(0)

const validatePromoCode = async (code: string) => {
  if (!code.trim()) return
  promoDiscount.value = 0
  try {
    const params: Record<string, string> = { code: code.trim() }
    if (props.selectedProduct) {
      const bundleId = getVariationId(props.selectedProduct, props.selectedPlan)
      if (bundleId) params.product_bundle_id = bundleId
    }
    const result = await $fetch<{
      success: boolean
      data: { data: Array<{ flatDiscount: number | null; percentDiscount: number | null }> }
    }>('/api/validate-promo', { method: 'GET', query: params })

    const entry = result?.data?.data?.[0]
    if (entry) {
      if (entry.flatDiscount !== null && entry.flatDiscount !== undefined) {
        promoDiscount.value = entry.flatDiscount
      } else if (entry.percentDiscount !== null && entry.percentDiscount !== undefined) {
        promoDiscount.value = Math.round(calculatedPrice.value * entry.percentDiscount / 100)
      }
    }
    if (promoDiscount.value > 0) {
      isPromoApplied.value = true
    }
  } catch (err) {
    console.warn('[PromoValidation] error:', err)
  }
}

const canSubmit = computed(() => {
  const isCardReady = paymentMethodType.value === 'card' && isPaymentComplete.value
  const isBNPLReady = paymentMethodType.value === 'bnpl' && isBNPLComplete.value
  return isAddressComplete.value && (isCardReady || isBNPLReady) && shippingAddress.value !== null && consentChecked.value
})

// Get monthly price for display
const getMonthlyPrice = () => {
  if (!props.selectedProduct) return 0
  const plan = props.selectedPlan || 'monthly'

  const threeMonthlyPrice = getVariationPrice(props.selectedProduct, 'threeMonthly')
  const sixMonthlyPrice = getVariationPrice(props.selectedProduct, 'sixMonthly')
  const yearlyPrice = getVariationPrice(props.selectedProduct, 'yearly')

  if (plan === 'threeMonthly' && threeMonthlyPrice) {
    return Math.floor(threeMonthlyPrice / 3)
  } else if (plan === 'sixMonthly' && sixMonthlyPrice) {
    return Math.floor(sixMonthlyPrice / 6)
  } else if (plan === 'yearly' && yearlyPrice) {
    return Math.floor(yearlyPrice / 12)
  }
  return getVariationPrice(props.selectedProduct, 'monthly') || 0
}

// Refill price for the currently selected plan
const currentRefillPrice = computed(() => {
  if (!props.selectedProduct) return null
  const plan = props.selectedPlan || 'monthly'
  return getVariationRefillPrice(props.selectedProduct, plan) ?? null
})

// Calculate savings
const formatSavings = () => {
  const oldTotal = getOldTotalPrice()
  if (!oldTotal) return '0'
  const savings = oldTotal - calculatedPrice.value
  return Math.max(0, Math.round(savings)).toString()
}

// Calculate total savings including promo discount
const formatTotalSavings = () => {
  const baseSavings = parseInt(formatSavings())
  const totalSavings = baseSavings + promoDiscount.value
  return Math.max(0, totalSavings).toString()
}

// Get discounted monthly price for display
const getDiscountedMonthlyPrice = () => {
  const baseMonthlyPrice = getMonthlyPrice()
  const plan = props.selectedPlan || 'monthly'

  let monthlyDiscount = 0
  if (plan === 'monthly') {
    monthlyDiscount = promoDiscount.value
  } else if (plan === 'threeMonthly') {
    monthlyDiscount = Math.floor(promoDiscount.value / 3)
  } else if (plan === 'sixMonthly') {
    monthlyDiscount = Math.floor(promoDiscount.value / 6)
  } else if (plan === 'yearly') {
    monthlyDiscount = Math.floor(promoDiscount.value / 12)
  }

  return Math.max(0, baseMonthlyPrice - monthlyDiscount)
}

// Get discounted total price for display
const getDiscountedTotalPrice = () => {
  return Math.max(0, calculatedPrice.value - promoDiscount.value)
}

// Get old total price based on the refill price for the selected plan
const getOldTotalPrice = () => {
  if (!props.selectedProduct) return null
  const plan = props.selectedPlan || 'monthly'
  const refill = getVariationRefillPrice(props.selectedProduct, plan)
  if (!refill) return null

  const multiplier: Record<string, number> = {
    monthly: 1, threeMonthly: 3, sixMonthly: 6, yearly: 12
  }
  return refill * (multiplier[plan] || 1)
}

// Handle address update
const handleBack = () => {
  emit('back')
}

const handleAddressUpdate = (address: AddressInfo | null, complete: boolean) => {
  isAddressComplete.value = complete
  shippingAddress.value = address
  updatePaymentData()
}

// Handle payment update (from StripePaymentOnly - just receives complete boolean)
const handlePaymentUpdate = (complete: boolean) => {
  isPaymentComplete.value = complete
  updatePaymentData()
}

// Handle BNPL update
const handleBNPLUpdate = (complete: boolean) => {
  isBNPLComplete.value = complete
  if (complete) {
    paymentMethodType.value = 'bnpl'
  }
  updatePaymentData()
}

// Handle BNPL success
const handleBNPLSuccess = (paymentIntentId: string) => {
}

// Handle BNPL error
const handleBNPLError = (error: string) => {
}

// Update payment data and emit
const updatePaymentData = () => {
  const isCardReady = paymentMethodType.value === 'card' && isPaymentComplete.value
  const isBNPLReady = paymentMethodType.value === 'bnpl' && isBNPLComplete.value

  if (isAddressComplete.value && (isCardReady || isBNPLReady) && shippingAddress.value) {
    emit('payment-update', {
      stripeSetupId: paymentMethodType.value === 'card' ? 'ready' : null,
      stripePaymentIntentId: paymentMethodType.value === 'bnpl' ? 'ready' : null,
      paymentType: paymentMethodType.value,
      shippingAddress: shippingAddress.value
    } as any)
  } else {
    emit('payment-update', {
      stripeSetupId: null,
      stripePaymentIntentId: null,
      paymentType: paymentMethodType.value,
      shippingAddress: shippingAddress.value
    } as any)
  }
}

const handleSubmit = () => {
  if (canSubmit.value && !props.isSubmitting && !isSubmittingLocal.value) {
    isSubmittingLocal.value = true
    // Emit submit event to parent
    // The parent (checkout.vue) will handle dispatching the appropriate Stripe confirmation event
    emit('submit')
  }
}

// Reset local submitting state when parent's isSubmitting becomes false (on error)
watch(() => props.isSubmitting, (newValue) => {
  if (!newValue) {
    isSubmittingLocal.value = false
  }
})

// Set payment method based on selected plan
watch(() => props.selectedPlan, (newPlan, oldPlan) => {
  // Only reset if plan actually changed (not on initial mount)
  if (oldPlan && newPlan !== oldPlan) {
    // Default to card for any plan
    paymentMethodType.value = 'card'
  }
}, { immediate: false })

// Reset payment completion states when switching between payment methods
watch(paymentMethodType, (newType, oldType) => {
  if (oldType && newType !== oldType) {
    // Prevent BNPL selection for monthly plans
    if (newType === 'bnpl' && props.selectedPlan === 'monthly') {
      paymentMethodType.value = 'card'
      return
    }

    // Customer.io: Track payment method selection
    const customerio = useCustomerio()
    if (newType === 'bnpl') {
      customerio.selectedBNPL()
    } else if (newType === 'card') {
      customerio.selectedCCPayment()
    }

    // Reset completion states when switching
    isPaymentComplete.value = false
    isBNPLComplete.value = false
    // Emit update to parent
    updatePaymentData()
  }
})

watch(promoCode, (newCode, oldCode) => {
  if (newCode !== oldCode) {
    if (newCode) {
      validatePromoCode(newCode)
    } else {
      promoDiscount.value = 0
      isPromoApplied.value = false
    }
  }
})

// Set initial payment method based on plan on mount
onMounted(async () => {
  // Default to card for all plans
  paymentMethodType.value = 'card'

  // Check for promo query parameter and apply appropriate promo code
  const route = useRoute()
  const promoParam = route.query.promo as string | undefined

  if (promoParam && props.selectedProduct) {
    const config = useRuntimeConfig()
    const plan = props.selectedPlan || 'monthly'
    const isSemaglutide = props.selectedProduct.name.toLowerCase().includes('semaglutide')
    const isTirzepatide = props.selectedProduct.name.toLowerCase().includes('tirzepatide')

    let codeToApply = ''

    // Product-specific promo codes (sema1mo, sema3mo, etc.)
    if (promoParam === 'sema1mo' && isSemaglutide && plan === 'monthly') {
      codeToApply = config.public.semaglutide1MonthCode as string
    } else if (promoParam === 'sema3mo' && isSemaglutide && plan === 'threeMonthly') {
      codeToApply = config.public.semaglutide3MonthCode as string
    } else if (promoParam === 'sema6mo' && isSemaglutide && plan === 'sixMonthly') {
      codeToApply = config.public.semaglutide6MonthCode as string
    } else if (promoParam === 'sema12mo' && isSemaglutide && plan === 'yearly') {
      codeToApply = config.public.semaglutide12MonthCode as string
    } else if (promoParam === 'tirz1mo' && isTirzepatide && plan === 'monthly') {
      codeToApply = config.public.tirzepatide1MonthCode as string
    } else if (promoParam === 'tirz3mo' && isTirzepatide && plan === 'threeMonthly') {
      codeToApply = config.public.tirzepatide3MonthCode as string
    } else if (promoParam === 'tirz6mo' && isTirzepatide && plan === 'sixMonthly') {
      codeToApply = config.public.tirzepatide6MonthCode as string
    } else if (promoParam === 'tirz12mo' && isTirzepatide && plan === 'yearly') {
      codeToApply = config.public.tirzepatide12MonthCode as string
    }
    // Universal promo codes that apply regardless of product (all1mo, all3mo, etc.)
    else if (promoParam === 'all1mo' && plan === 'monthly') {
      codeToApply = isSemaglutide
        ? config.public.semaglutide1MonthCode as string
        : config.public.tirzepatide1MonthCode as string
    } else if (promoParam === 'all3mo' && plan === 'threeMonthly') {
      codeToApply = isSemaglutide
        ? config.public.semaglutide3MonthCode as string
        : config.public.tirzepatide3MonthCode as string
    } else if (promoParam === 'all6mo' && plan === 'sixMonthly') {
      codeToApply = isSemaglutide
        ? config.public.semaglutide6MonthCode as string
        : config.public.tirzepatide6MonthCode as string
    } else if (promoParam === 'all12mo' && plan === 'yearly') {
      codeToApply = isSemaglutide
        ? config.public.semaglutide12MonthCode as string
        : config.public.tirzepatide12MonthCode as string
    }
    // Special case: applyAll - apply the appropriate promo code based on product and plan
    else if (promoParam === 'applyAll') {
      if (isSemaglutide) {
        if (plan === 'monthly') {
          codeToApply = config.public.semaglutide1MonthCode as string
        } else if (plan === 'threeMonthly') {
          codeToApply = config.public.semaglutide3MonthCode as string
        } else if (plan === 'sixMonthly') {
          codeToApply = config.public.semaglutide6MonthCode as string
        } else if (plan === 'yearly') {
          codeToApply = config.public.semaglutide12MonthCode as string
        }
      } else if (isTirzepatide) {
        if (plan === 'monthly') {
          codeToApply = config.public.tirzepatide1MonthCode as string
        } else if (plan === 'threeMonthly') {
          codeToApply = config.public.tirzepatide3MonthCode as string
        } else if (plan === 'sixMonthly') {
          codeToApply = config.public.tirzepatide6MonthCode as string
        } else if (plan === 'yearly') {
          codeToApply = config.public.tirzepatide12MonthCode as string
        }
      }
    }
    // Special case: allBundles - apply promo code for all bundles EXCEPT 1-month plans
    else if (promoParam === 'allBundles' && plan !== 'monthly') {
      if (isSemaglutide) {
        if (plan === 'threeMonthly') {
          codeToApply = config.public.semaglutide3MonthCode as string
        } else if (plan === 'sixMonthly') {
          codeToApply = config.public.semaglutide6MonthCode as string
        } else if (plan === 'yearly') {
          codeToApply = config.public.semaglutide12MonthCode as string
        }
      } else if (isTirzepatide) {
        if (plan === 'threeMonthly') {
          codeToApply = config.public.tirzepatide3MonthCode as string
        } else if (plan === 'sixMonthly') {
          codeToApply = config.public.tirzepatide6MonthCode as string
        } else if (plan === 'yearly') {
          codeToApply = config.public.tirzepatide12MonthCode as string
        }
      }
    }
    // Direct promo code passthrough (use the promo param value as-is)
    else if (promoParam === 'avintest1') {
      codeToApply = 'avintest1'
    }
    // SPECIALSMS10: $10 off monthly semaglutide only
    else if (promoParam === 'SPECIALSMS10' || promoParam === 'specialsms10') {
      if (isSemaglutide && plan === 'monthly') {
        codeToApply = config.public.specialSms10Code as string
      }
    }
    // SPECIALSMS20: $20 off monthly tirzepatide only
    else if (promoParam === 'SPECIALSMS20' || promoParam === 'specialsms20') {
      if (isTirzepatide && plan === 'monthly') {
        codeToApply = config.public.specialSms20Code as string
      }
    }

    // Apply the promo code if found
    if (codeToApply && codeToApply.trim()) {
      promoCode.value = codeToApply.trim()
      isPromoApplied.value = true
    }
  }
  startCountdown()
})

//
onUnmounted(() => {
  stopCountdown()
})

// Focus promo input when banner is clicked
const focusPromoInput = () => {
  promoInputRef.value?.focus()
}

// Handle promo code blur (when user clicks off)
const handlePromoBlur = () => {
  if (promoCode.value.trim()) {
    isPromoApplied.value = true
    validatePromoCode(promoCode.value)
  } else {
    isPromoApplied.value = false
    promoDiscount.value = 0
  }
}

// Handle promo code focus (when user clicks to edit)
const handlePromoFocus = () => {
  isPromoApplied.value = false
}

// Helper functions
const formatPrice = (price: number) => {
  return price.toLocaleString('en-US')
}

const getMedicationName = (product: Product) => {
  if (product.name.includes('Semaglutide')) {
    return 'Compounded Semaglutide'
  } else if (product.name.includes('Tirzepatide')) {
    return 'Compounded Tirzepatide'
  }
  return product.name
}

const getFrequencyName = (plan: string) => {
  const frequencyMap: Record<string, string> = {
    'monthly': 'Monthly plan',
    'threeMonthly': '3-Month plan',
    'sixMonthly': '6-Month plan',
    'yearly': '12-Month plan'
  }
  return frequencyMap[plan] || 'Monthly plan'
}

// Watch for payment data changes from parent
watch(() => props.paymentData, (newData) => {
  if (newData?.shippingAddress) {
    shippingAddress.value = newData.shippingAddress
    isAddressComplete.value = true
  }
  if (newData?.stripeSetupId && newData.stripeSetupId === 'ready') {
    isPaymentComplete.value = true
  }
}, { immediate: true })

// Watch for consent checkbox changes and emit to parent
watch(consentChecked, (newValue) => {
  // Emit the consent value as a string (the full consent text if checked, empty if not)
  emit('update-consent', newValue ? consentText : '')
}, { immediate: true })

// Computed property to get validation state
const canFinish = computed(() => {
  return canSubmit.value
})

// Method to get current shipping address
const getShippingAddress = async (): Promise<AddressInfo | null> => {
  // First try to get from Stripe element directly
  if (stripeAddressRef.value?.getCurrentAddress) {
    try {
      const address = await stripeAddressRef.value.getCurrentAddress()
      if (address) {
        return address
      }
    } catch (e) {
      console.warn('⚠️ Error getting address from Stripe element:', e)
    }
  }
  // Fallback to cached address
  return shippingAddress.value
}

// Expose for parent component
// Method to switch payment method to BNPL (called from parent on insufficient funds)
const switchPaymentMethodToBNPL = () => {
  paymentMethodType.value = 'bnpl'
}

const remountPaymentElement = () => {
  isPaymentComplete.value = false
  paymentElementKey.value++
}

defineExpose({
  stripeAddressRef,
  stripePaymentRef,
  promoCode,
  isPromoApplied,
  canFinish,
  getShippingAddress,
  switchPaymentMethodToBNPL,
  remountPaymentElement
})
</script>

<style scoped>
/* Ensure Stripe elements take full width */
:deep(#element-address),
:deep(#element-payment) {
  width: 100% !important;
}

:deep(#element-address > *),
:deep(#element-payment > *) {
  width: 100% !important;
}

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
