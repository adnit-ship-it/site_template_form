<template>
  <div class="pb-0 lg:pb-24 relative max-w-7xl mx-auto">
    <!-- Back button is rendered inside LayoutNavbar (see `useNavbarBack`
         wiring in pages/checkout.vue). -->

    <!-- Loading Overlay -->
    <div v-show="showOverlay"
         class="fixed inset-0 bg-white z-20 transition-opacity duration-300 ease-out flex items-center justify-center"
         :class="overlayOpacity">
      <!-- Spinner -->
      <div class="w-10 h-10 border-2 border-accentColor2 border-t-transparent rounded-full spinner-slow"></div>
    </div>

    <!-- Header -->
    <div class="text-center mb-4 sm:mb-8">
      <div class="rounded-[6px] max-w-[686px] mx-auto  bg-accentColor1/20 w-full h-[58px] flex justify-center items-center">
        <p class="font-semibold min-[372px]:text-lg text-base">
          <template v-if="promoMessage">
            <span class="text-accentColor1 font-extrabold">{{ promoMessage }}</span>
          </template>
          <template v-else>
            Your Discount is Reserved for <span class="text-accentColor1 font-extrabold">{{ formattedTime }}</span>
          </template>
        </p>
      </div>
      <h1 class="md:text-3xl min-[380px]:text-xl min-[372px]:text-lg text-[15px] mt-4 font-bold capitalize leading-10 text-bodyColor">
        Transparent Pricing. Complete Care.
      </h1>
      <p class="font-semibold min-[380px]:text-base min-[372px]:text-sm text-xs" v-if="!isSingleVariation">Every dosage level included — without extra fees.</p>
    </div>
    <div class="flex items-center gap-3 w-full max-w-[686px] mx-auto mb-4">
      <p class="text-white text-sm font-semibold px-4 py-2 rounded-full bg-accentColor1">Step 1</p>
      <p class="text-[22px]/[24px] font-semibold">Select Treatment</p>
    </div>
    <!-- Plan Cards Layout -->
    <div id="select-product" class="flex flex-col gap-4 max-w-[686px] mx-auto mb-8">
      <UiPlanCard v-for="variation in visibleVariations" :key="variation.id"
                  :id="`product-${variation.id}`"
                  :name="variation.selectionName || variation.name"
                  :sub-name="variation.selectionDescription"
                  :image="variation.images.mainImg"
                  :description="getVariationDescription(variation)" :badge="getVariationBadge(variation)"
                  :badge-color="getVariationBadgeColor(variation)"
                  :is-selected="selectedProduct?.id === variation.id" :is-disabled="isSubmitting"
                  :class="{ 'selected-product': selectedProduct?.id === variation.id }"
                  @click="!isSubmitting && selectProduct(variation)" />
    </div>

    <!-- Frequency Selector (shown when variation is selected) -->
    <div v-if="selectedProduct" ref="frequencySectionRef" class="max-w-[686px] mx-auto">
      <CheckoutFrequencySelector :selected-product="selectedProduct" :selected-category="selectedCategory"
                                 :bundle-price="bundlePriceOverride || getVariationPrice(selectedProduct, 'monthly') || 0" :is-submitting="isSubmitting"
                                 @update-bundle-price="handleBundlePriceUpdate" @update-bundle-medications="handleBundleMedicationsUpdate"
                                 @update-plan="handlePlanUpdate" @advance-to-payment="$emit('advance-to-payment')" />
    </div>

    <!-- How It Works Section -->
    <div class="mt-8 max-w-[686px] mx-auto">
      <div class="bg-[#fcfcfc] px-8 py-3 rounded-xl">
        <button @click="isAllPlansExpanded = !isAllPlansExpanded"
                class="w-full flex items-center justify-between text-left">
          <h3 class="text-xl lg:text-2xl font-medium text-bodyColor">All Plans Include</h3>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-bodyColor transition-transform duration-200"
               :class="{ 'rotate-180': isAllPlansExpanded }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <!-- Dropdown Content - Outside grey container -->
      <div v-show="isAllPlansExpanded" class="space-y-2 mt-3 pl-8 pr-4">
        <div class="flex items-start gap-3">
          <NuxtImg src="/assets/images/brand/check-alt.svg" alt="Check"
                   class="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
          <p class="text-bodyColor">Bundle & save options</p>
        </div>
        <div class="flex items-start gap-3">
          <NuxtImg src="/assets/images/brand/check-alt.svg" alt="Check"
                   class="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
          <p class="text-bodyColor">Unlimited free doctor consultations</p>
        </div>
        <div class="flex items-start gap-3">
          <NuxtImg src="/assets/images/brand/check-alt.svg" alt="Check"
                   class="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
          <p class="text-bodyColor">Free expedited shipping*</p>
        </div>
        <div class="flex items-start gap-3">
          <NuxtImg src="/assets/images/brand/check-alt.svg" alt="Check"
                   class="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
          <p class="text-bodyColor">Home injection kit</p>
        </div>
        <div class="flex items-start gap-3">
          <NuxtImg src="/assets/images/brand/check-alt.svg" alt="Check"
                   class="w-[18px] h-[18px] flex-shrink-0 mt-0.5" />
          <p class="text-bodyColor">24/7 customer support</p>
        </div>
      </div>
    </div>

    <!-- Payment Notice -->
    <div class="mt-6 max-w-[686px] mx-auto bg-[#fcfcfc] rounded-xl px-8 py-5">
      <p class="text-bodyColor font-semibold">(NOTE: You will not be charged until after your medical evaluation)</p>
      <p class="text-bodyColor mt-2 text-sm">Payment is only processed once your prescription is approved and our pharmacy has prepared your medication for shipment.</p>
    </div>

    <div class="mt-6 max-w-[686px] mx-auto p-5 lg:p-7 bg-[#fcfcfc] rounded-xl flex flex-col gap-4">
      <p class="text-sm lg:text-base font-bold text-bodyColor">All major credit cards accepted</p>
      <div class="flex gap-3 lg:gap-4 items-center">
        <img src="/assets/images/icons/visa.png" alt="Visa" class="w-auto h-[24px] lg:h-[32px]">
        <img src="/assets/images/icons/mastercard.png" alt="Visa" class="w-auto h-[24px] lg:h-[32px]">
        <img src="/assets/images/icons/amex.png" alt="Visa" class="w-auto h-[24px] lg:h-[32px]">
        <img src="/assets/images/icons/discover.png" alt="Visa" class="w-auto h-[24px] lg:h-[32px]">
        <img src="/assets/images/icons/applepay.png" alt="Visa" class="w-auto h-[24px] lg:h-[32px]">
        <img src="/assets/images/icons/gpay.png" alt="Visa" class="w-auto h-[24px] lg:h-[32px]">
      </div>
      <img src="/assets/images/icons/hsafsa.png" alt="Stripe" class="w-[166px] lg:w-[208px] h-[34px] lg:h-[42px] my-4">
      <p class="text-sm lg:text-base font-bold text-bodyColor">Buy Now, Pay Later</p>
      <div class="flex gap-3 lg:gap-4 items-center">
        <img src="/assets/images/icons/afterpay-lg.png" alt="Visa" class="w-auto h-[36px] lg:h-[44px] rounded-lg">
        <img src="/assets/images/icons/klarna-lg.png" alt="Visa" class="w-auto h-[36px] lg:h-[44px]">
        <img src="/assets/images/icons/affirm-lg.png" alt="Visa" class="w-auto h-[36px] lg:h-[44px] py-0.5">
      </div>
    </div>

    <!-- Show More Button -->
    <!-- <div v-if="hasMoreVariations" class="text-center mb-8">
      <button @click="showAllVariations = true"
        class="text-bodyColor/70 font-bold text-lg underline transition-all duration-200" :disabled="isSubmitting">
        Show more...
      </button>
    </div> -->


  </div>
</template>

<script setup lang="ts">
import type { Category, Product, PlanType } from '~/types/checkout'
import { getVariationPrice, hasVariation } from '~/types/checkout'
import { computed, watch, ref, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
  selectedCategory: Category | null
  selectedProduct: Product | null
  selectedPlan: PlanType
  isSubmitting: boolean
  formAnswers: any
}

interface Emits {
  (e: 'select-product', product: Product): void
  (e: 'select-plan', plan: PlanType): void
  (e: 'update-bundle-price', price: number): void
  (e: 'update-bundle-medications', medications: { glp: string, nad: string }): void
  (e: 'advance-to-payment'): void
  (e: 'back'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State for showing all variations
const showAllVariations = ref(false)

// Toggle states for collapsible sections (both start open)
const isAllPlansExpanded = ref(true)
const isPaymentMethodsExpanded = ref(true)

// Bundle price override for GLP+NAD bundle
const bundlePriceOverride = ref<number | null>(null)

// Countdown Timer Logic
const timeRemaining = ref(600) // 10 minutes in seconds (10:00)
const countdownInterval = ref<number | null>(null)

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// Promo message based on query parameter
const promoMessage = computed(() => {
  const route = useRoute()
  const promoParam = route.query.promo as string | undefined

  if (!promoParam) return null

  // Product-specific promo codes - extract product name from promo code
  if (promoParam.startsWith('sema')) {
    if (promoParam === 'sema1mo') return 'Your Promo Code is Applied for 1 month of Semaglutide'
    if (promoParam === 'sema3mo') return 'Your Promo Code is Applied for 3 months of Semaglutide'
    if (promoParam === 'sema6mo') return 'Your Promo Code is Applied for 6 months of Semaglutide'
    if (promoParam === 'sema12mo') return 'Your Promo Code is Applied for 12 months of Semaglutide'
  }

  if (promoParam.startsWith('tirz')) {
    if (promoParam === 'tirz1mo') return 'Your Promo Code is Applied for 1 month of Tirzepatide'
    if (promoParam === 'tirz3mo') return 'Your Promo Code is Applied for 3 months of Tirzepatide'
    if (promoParam === 'tirz6mo') return 'Your Promo Code is Applied for 6 months of Tirzepatide'
    if (promoParam === 'tirz12mo') return 'Your Promo Code is Applied for 12 months of Tirzepatide'
  }

  // Universal promo codes - show generic message
  if (promoParam === 'all1mo') return 'Your Promo Code is Applied for 1 Month Bundles'
  if (promoParam === 'all3mo') return 'Your Promo Code is Applied for 3 Month Bundles'
  if (promoParam === 'all6mo') return 'Your Promo Code is Applied for 6 Month Bundles'
  if (promoParam === 'all12mo') return 'Your Promo Code is Applied for 12 Month Bundles'

  // Special cases
  if (promoParam === 'applyAll') return 'Your Promo Code is Applied to All Monthly Bundles'
  if (promoParam === 'allBundles') return 'Your Promo Code is Applied to All Bundles 3 months and up'

  // Direct promo codes
  if (promoParam === 'avintest1') return 'Your Promo Code "avintest1" is Applied'

  // SPECIALSMS10: $10 off monthly semaglutide only
  if (promoParam === 'SPECIALSMS10' || promoParam === 'specialsms10') {
    return '$10 Discount Applied for Semaglutide Monthly Plan'
  }

  // SPECIALSMS20: $20 off monthly tirzepatide only
  if (promoParam === 'SPECIALSMS20' || promoParam === 'specialsms20') {
    return '$20 Discount Applied for Tirzepatide Monthly Plan'
  }

  return null
})

// Show promo message or countdown timer
const headerMessage = computed(() => {
  return promoMessage.value || `Your price is reserved for ${formattedTime.value}`
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

const firstName = computed(() => {
  return props.formAnswers?.firstName || ''
})

// Check if a single product is pre-selected via productId
const isSingleVariation = computed(() => {
  const route = useRoute()
  return !!route.query.productId
})

const headerText = computed(() => {
  return isSingleVariation.value ? 'Review your selected medication' : 'Select your preferred medication'
})

const helpText = computed(() => {
  return 'If unsure which product is right for you, please select the product you are most interested in.'
})

// Filter products to show based on productId or categoryId
const reorderedVariations = computed(() => {
  if (!props.selectedCategory?.products) return []

  const route = useRoute()
  const productId = route.query.productId as string

  // If a valid productId exists, show only that product
  if (productId) {
    const targetVariation = props.selectedCategory.products.find((v: any) => v.id === productId)
    if (targetVariation) {
      return [targetVariation]
    }
  }

  // categoryId — all products already filtered by quizId in checkout.vue onMounted
  const categoryId = route.query.categoryId as string
  if (categoryId) {
    return props.selectedCategory.products
  }

  // Default: show only compounded-semaglutide and compounded-tirzepatide
  return props.selectedCategory.products.filter((v: any) =>
    v.id === 'compounded-semaglutide' || v.id === 'compounded-tirzepatide'
  )
})

// Computed properties for showing limited variations
const visibleVariations = computed(() => {
  // reorderedVariations already handles all filtering
  return reorderedVariations.value
})

// Check if data is ready (variations available)
const isDataReady = computed(() => {
  try {
    return !!(visibleVariations.value && visibleVariations.value.length > 0)
  } catch (error) {
    return false
  }
})

// Overlay state
const showOverlay = ref(false)
const overlayOpacity = ref('opacity-100')
const hasShownOverlayOnce = ref(false)
let overlayTimeoutId: ReturnType<typeof setTimeout> | null = null

// Watch for data ready and fade out overlay
watch(isDataReady, (ready) => {
  if (ready && !hasShownOverlayOnce.value) {
    // Clear the safety timeout since data loaded successfully
    if (overlayTimeoutId) {
      clearTimeout(overlayTimeoutId)
      overlayTimeoutId = null
    }

    // Data is ready for the first time, fade out overlay
    overlayOpacity.value = 'opacity-0'
    setTimeout(() => {
      showOverlay.value = false
      hasShownOverlayOnce.value = true
    }, 300)
  } else if (ready && hasShownOverlayOnce.value) {
    // Data is ready but we've already shown overlay - don't show again
    showOverlay.value = false
  }
}, { immediate: true })

// Start countdown timer on mount
onMounted(async () => {
  await nextTick()

  // Only show overlay if data is not ready and we haven't shown it before
  if (!isDataReady.value && !hasShownOverlayOnce.value) {
    showOverlay.value = true
    overlayOpacity.value = 'opacity-100'

    // Safety timeout: Force hide overlay after 1.5 seconds
    overlayTimeoutId = setTimeout(() => {
      overlayOpacity.value = 'opacity-0'
      setTimeout(() => {
        showOverlay.value = false
        hasShownOverlayOnce.value = true
      }, 300)
    }, 1500)
  }

  startCountdown()
})

onUnmounted(() => {
  stopCountdown()

  // Clear overlay timeout if component unmounts
  if (overlayTimeoutId) {
    clearTimeout(overlayTimeoutId)
  }
})

const hasMoreVariations = computed(() => {
  // We show all variations by default, so no "show more" needed
  return false
})


const frequencySectionRef = ref<HTMLElement | null>(null)

const selectProduct = async (product: Product) => {
  emit('select-product', product)

  // Customer.io: Track product selection
  const customerio = useCustomerio()
  customerio.selectedProduct(product.name || product.id)

  // Wait for DOM to update, then smooth scroll and focus first frequency card
  await nextTick()

  window.scrollBy({
    top: 420,
    behavior: 'smooth'
  })

  if (frequencySectionRef.value) {
    const firstCard = frequencySectionRef.value.querySelector<HTMLElement>('[tabindex="0"]')
    firstCard?.focus({ preventScroll: true })
  }
}


// Watch for product changes and set plan to threeMonthly by default (or monthly if not available)
watch(() => props.selectedProduct, (newProduct, oldProduct) => {
  if (newProduct && newProduct.id !== oldProduct?.id) {
    // When switching products, prefer threeMonthly, fallback to monthly
    if (hasVariation(newProduct, 'threeMonthly')) {
      emit('select-plan', 'threeMonthly')
    } else if (hasVariation(newProduct, 'monthly')) {
      emit('select-plan', 'monthly')
    }
  }
})

// Auto-select the single variation when only one is visible
watch(visibleVariations, (variations) => {
  if (variations.length === 1) {
    const singleVariation = variations[0]
    // Only auto-select if variation exists and no variation is currently selected or if the selected one doesn't match
    if (singleVariation && (!props.selectedProduct || props.selectedProduct.id !== singleVariation.id)) {
      selectProduct(singleVariation)
    }
  }
}, { immediate: true })

const selectPlan = (plan: 'monthly' | 'threeMonthly' | 'sixMonthly' | 'yearly') => {
  emit('select-plan', plan)
}

const calculateSavings = (months: number) => {
  if (!props.selectedProduct) return 0

  const monthlyPrice = getVariationPrice(props.selectedProduct, 'monthly')
  if (!monthlyPrice) return 0

  let bulkPrice = 0
  if (months === 3) {
    bulkPrice = getVariationPrice(props.selectedProduct, 'threeMonthly') || 0
  } else if (months === 6) {
    bulkPrice = getVariationPrice(props.selectedProduct, 'sixMonthly') || 0
  } else if (months === 12) {
    bulkPrice = getVariationPrice(props.selectedProduct, 'yearly') || 0
  }

  if (!bulkPrice) return 0

  const regularTotal = monthlyPrice * months
  const savings = regularTotal - bulkPrice

  return Math.max(0, savings)
}

const formatPrice = (price: number | undefined) => {
  if (!price) return '0'
  return price.toLocaleString('en-US')
}

const getVariationDescription = (variation: Product) => {
  return variation.intro || ''
}

const getVariationBadge = (variation: Product) => {
  // Check if it's semaglutide for "More Affordable" badge
  if (variation.id === 'compounded-semaglutide') {
    return 'More Affordable'
  }
  // Check if it's tirzepatide for "Fastest Results" badge
  if (variation.id === 'compounded-tirzepatide') {
    return 'Fastest Results'
  }
  return "FDA-Approved"
}

const getVariationBadgeColor = (variation: Product): 'green' | 'purple' => {
  if (variation.id === 'compounded-semaglutide') {
    return 'green'
  }
  if (variation.id === 'compounded-tirzepatide') {
    return 'purple'
  }
  return 'green'
}

// Handle bundle price updates from FrequencySelector
const handleBundlePriceUpdate = (price: number) => {
  bundlePriceOverride.value = price
  emit('update-bundle-price', price)
}

// Handle bundle medication updates from FrequencySelector
const handleBundleMedicationsUpdate = (medications: { glp: string, nad: string }) => {
  emit('update-bundle-medications', medications)
}

// Handle plan updates from FrequencySelector
const handlePlanUpdate = (plan: PlanType) => {
  emit('select-plan', plan)
}

const getSelectedPrice = () => {
  if (!props.selectedProduct) {
    return 0
  }

  // Use the selected plan price
  switch (props.selectedPlan) {
    case 'monthly':
      return getVariationPrice(props.selectedProduct, 'monthly') || 0
    case 'threeMonthly':
      return getVariationPrice(props.selectedProduct, 'threeMonthly') || 0
    case 'sixMonthly':
      return getVariationPrice(props.selectedProduct, 'sixMonthly') || 0
    case 'yearly':
      return getVariationPrice(props.selectedProduct, 'yearly') || 0
    default:
      return getVariationPrice(props.selectedProduct, 'monthly') || 0
  }
}


</script>

<style scoped>
.plan-button {
  @apply flex items-center gap-3 p-3 bg-white border-2 rounded-xl border-bodyColor cursor-pointer transition-all duration-200 hover:border-accentColor1 flex-1 relative;
}

.plan-button.selected {
  @apply border-accentColor1 bg-accentColor1/20 shadow-lg;
}

.radio-indicator {
  @apply w-5 h-5 rounded-full border-2 border-bodyColor flex items-center justify-center flex-shrink-0;
}

.plan-button.selected .radio-indicator {
  @apply border-accentColor1;
}

.radio-dot {
  @apply w-2.5 h-2.5 rounded-full;
}

.plan-button.selected .radio-dot {
  @apply bg-accentColor1;
}

.button-text {
  @apply text-bodyColor;
}

.best-deal-badge {
  @apply absolute -top-2 -right-2 bg-accentColor1 text-white text-xs font-bold px-2 py-1 rounded-full;
}

.savings-tag {
  @apply bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap;
}

/* Add hover effect to radio indicator when parent is hovered */
.flex-1:hover .w-6.h-6.rounded-full {
  @apply border-accentColor1;
}

/* Show more button styling */
button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Spinner animation */
.spinner-slow {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
