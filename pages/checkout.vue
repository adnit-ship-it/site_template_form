<template>
  <!-- Payment Processing Overlay (shown only for BNPL success processing) -->
  <div v-if="isSubmittingBNPL" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white p-4 md:p-8 max-w-md mx-4 rounded-2xl text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accentColor1 mx-auto mb-4"></div>
      <h3 class="text-xl font-bold text-bodyColor mb-2">Please wait</h3>
      <p class="text-bodyColor">We are processing your request...</p>
    </div>
  </div>

  <div ref="checkoutContainerRef" class="container mx-auto px-4 md:p-6 lg:p-8 pb-24 md:pb-32">
    <div class="max-w-[1248px] mx-auto">
      <!-- Step 1: Variation Selection (includes Frequency Selector) -->
      <CheckoutVariationSelection v-if="currentStep === 1"
        :selected-category="selectedCategory" :selected-product="selectedProduct"
        :selected-plan="selectedPlan" :is-submitting="isSubmitting"
        :form-answers="formAnswers" @select-product="selectProduct" @select-plan="selectPlan"
        @update-bundle-price="handleBundlePriceUpdate" @update-bundle-medications="handleBundleMedicationsUpdate"
        @advance-to-payment="nextStep" @back="goBackToQuiz" />

      <!-- Step 2: Payment -->
      <CheckoutPaymentStep ref="paymentStepRef" v-if="currentStep === 2"
        :selected-category="selectedCategory" :selected-product="selectedProduct" :selected-plan="selectedPlan"
        :payment-data="paymentData ?? { stripeSetupId: null, shippingAddress: null }" :is-stripe-loaded="isStripeLoaded"
        :form-answers="formAnswers" :is-submitting="isSubmitting" :ship-to-mexico="false"
        @payment-update="handlePaymentUpdate" @back="prevStep" @submit="processPaymentWithConfirmation" 
        @update-consent="(value) => handleFormAnswersUpdate({ consent: value })" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'checkout' })
useHead({
  title: 'Complete your intake today!'
})
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { Product, Category, PlanType } from '~/types/checkout'
import { getVariationPrice, getVariationId } from '~/types/checkout'
import { categories, products } from '~/data/products'
import { useCheckout } from '~/composables/useCheckout'
import { useStripe } from '~/composables/useStripe'
import { scrollToTop } from '~/utils/scrollToTop'

// Define AddressInfo interface to match StripePayment component
interface AddressInfo {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
}

// Use checkout composable for state management
const {
  currentStep,
  selectedCategory,
  selectedProduct,
  selectedPlan,
  paymentData,
  isStripeLoaded,
  isProcessing,
  isSubmitting,
  formAnswers,
  canProcessPayment,
  selectCategory,
  selectProduct,
  selectPlan,
  goBack,
  prevStep,
  nextStep,
  loadStoredData,
  handlePaymentUpdate,
  handleFormAnswersUpdate,
  resetStripeLoaded,
  setStripeLoaded,
  setSubmitting,
  setProcessing,
  clearCheckoutData,
  resetPaymentState,
  isQuizCompleted,
  getRequiredQuizId
} = useCheckout()

// Stripe-specific refs
const paymentStepRef = ref()
const frequencySelectorRef = ref()
const checkoutContainerRef = ref<HTMLElement | null>(null)

// Bundle price override for GLP+NAD bundle
const bundlePriceOverride = ref<number | null>(null)

// BNPL submission state
const isSubmittingBNPL = ref(false)

// Get GTM instance for tracking events
const nuxtApp = useNuxtApp()

// Shipping destination modal state
const showShippingModal = ref(false)
const shippingDestination = ref<'US' | 'Mexico' | null>(null)

// Computed property that combines checkout validation with payment form validation
const canSubmitPayment = computed(() => {
  // First check basic checkout requirements
  if (!canProcessPayment.value) {
    return false
  }

  // Then check if payment form (including address) is complete
  return paymentStepRef.value?.canFinish || false
})

// Handle bundle price updates
const handleBundlePriceUpdate = (price: number) => {
  bundlePriceOverride.value = price
}

// Handle bundle medication selections
const handleBundleMedicationsUpdate = (medications: { glp: string, nad: string }) => {
  // Store the selected medications in form answers
  formAnswers.bundleGLP = medications.glp
  formAnswers.bundleNAD = medications.nad
}

// Function to go back to quiz
const goBackToQuiz = async () => {
  const route = useRoute()
  const categoryId = route.query.categoryId as string
  const productId = route.query.productId as string
  const promo = route.query.promo as string

  // Determine required quiz ID from productId or categoryId
  let requiredQuizId = getRequiredQuizId(categoryId)

  if (!requiredQuizId && productId) {
    for (const product of products) {
      const variation = product.variations.find((v: any) => v.id === productId)
      if (variation) {
        requiredQuizId = product.quizId || product.id
        break
      }
    }
  }

  if (requiredQuizId) {
    localStorage.removeItem(`quiz_${requiredQuizId}_completed`)
  }

  const queryParams: Record<string, string> = {}

  if (productId) {
    queryParams.productId = productId
  } else if (categoryId) {
    queryParams.categoryId = categoryId
  }

  // Preserve promo code if it exists
  if (promo) {
    queryParams.promo = promo
  }

  // Preserve all UTM and tracking parameters
  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'affid', 'oid', 'uid', 'affid2', 'oid2', 'uid2',
    'sub1', 'sub2', 'sub3', 'sub4', 'sub5', 'source_id',
    '_ef_transaction_id'
  ]

  trackingParams.forEach(param => {
    const value = route.query[param] as string
    if (value) {
      queryParams[param] = value
    }
  })

  const queryString = new URLSearchParams(queryParams).toString()
  navigateTo(queryString ? `/?${queryString}` : '/')
}

// Function to show shipping destination modal
const showShippingDestinationModal = () => {
  showShippingModal.value = true
  // Don't call nextStep() here - let the modal handle the transition
}

// Function to handle shipping destination confirmation
const handleShippingDestinationConfirm = (destination: 'US' | 'Mexico') => {
  shippingDestination.value = destination
  showShippingModal.value = false

  // Update form answers with shipping destination
  // formAnswers is already a reactive object, not a ref
  formAnswers.shipToMexico = destination === 'Mexico' ? 'Yes' : 'No'
  console.log('✅ Set shipToMexico to:', formAnswers.shipToMexico, 'for destination:', destination)

  // Proceed to payment step
  nextStep()
}

// Load stored data on mount
onMounted(async () => {
  // Wait for route to be fully ready (fixes timing issue when navigating back)
  await nextTick()

  // Give a small delay to ensure route query params are available after history.back()
  await new Promise(resolve => setTimeout(resolve, 50))

  // Auto-select product based on priority: productId > categoryId > default
  const route = useRoute()
  const categoryId = route.query.categoryId as string
  const productId = route.query.productId as string

  let foundCategory: Category | null = null
  let foundProduct: Product | null = null
  let requiredQuizId: string | null = null

  if (productId) {
    // Priority 1: productId — find the product containing this variation UUID
    for (const category of categories) {
      for (const product of category.products) {
        if (product.variations.some(v => v.id === productId)) {
          foundCategory = category
          foundProduct = product
          requiredQuizId = product.quizId || category.id
          break
        }
      }
      if (foundProduct) break
    }
    if (!foundProduct) {
      navigateTo('/')
      return
    }
  } else if (categoryId) {
    // Priority 3: categoryId — collect all products whose quizId matches
    requiredQuizId = categoryId

    const matchingProducts: Product[] = []
    for (const category of categories) {
      for (const product of category.products) {
        if (product.quizId === categoryId) {
          matchingProducts.push(product)
        }
      }
    }

    if (matchingProducts.length > 0) {
      foundCategory = {
        id: categoryId,
        name: categoryId,
        images: { mainImg: '' },
        products: matchingProducts,
      }
    } else {
      foundCategory = categories.find(c => c.id === categoryId) || null
    }
  } else {
    // Priority 4: nothing present — redirect to index to complete quiz
    navigateTo('/')
    return
  }

  // Validate that the required quiz has been completed
  // BUT: Don't redirect if this is a BNPL return (we should have already handled it above)
  const isBNPLReturn = !!route.query.payment_intent

  if (requiredQuizId && !isQuizCompleted(requiredQuizId) && !isBNPLReturn) {
    // Quiz not completed for this category, redirect to complete it
    const promo = route.query.promo as string
    
    const queryParams: Record<string, string> = {}
    
    if (productId) {
      queryParams.productId = productId
    } else if (categoryId) {
      queryParams.categoryId = categoryId
    }
    
    // Preserve promo code if it exists
    if (promo) {
      queryParams.promo = promo
    }
    
    const queryString = new URLSearchParams(queryParams).toString()
    navigateTo(queryString ? `/?${queryString}` : '/')
    return
  }

  // Load stored data first (but don't override our preselection)
  loadStoredData()

  if (foundCategory) {
    selectCategory(foundCategory)

    if (foundProduct) {
      selectProduct(foundProduct)

      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedProduct', JSON.stringify(foundProduct))
      }
    }
  }

  // Check for BNPL payment return (payment_intent and payment_intent_client_secret in query)
  const paymentIntent = route.query.payment_intent as string
  const paymentIntentClientSecret = route.query.payment_intent_client_secret as string

  if (paymentIntent && paymentIntentClientSecret) {
    const hasBNPLData = localStorage.getItem('bnpl_product_data')
    if (hasBNPLData) {
      await verifyAndProcessBNPLPayment(paymentIntent, paymentIntentClientSecret)
    } else {
      console.warn('⚠️ Cannot determine payment type, defaulting to BNPL')
      await verifyAndProcessBNPLPayment(paymentIntent, paymentIntentClientSecret)
    }
  }

})

// Load Stripe when on payment step
watch(currentStep, async (newStep, oldStep) => {
  // Scroll to top with smooth animation when step changes
  if (oldStep && newStep !== oldStep) {
    scrollToTop()

    // Focus the first interactive element in the new step
    await nextTick()
    if (checkoutContainerRef.value) {
      const firstFocusable = checkoutContainerRef.value.querySelector<HTMLElement>(
        '[tabindex="0"], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), a[href]'
      )
      firstFocusable?.focus()
    }
  }

  // Fire GTM event when payment step is shown
  if (newStep === 2 && oldStep !== 2) {
    if (nuxtApp.$googleTagManager) {
      (nuxtApp.$googleTagManager as any).push({
        event: 'PAYMENT_LOAD'
      });
    }

    // Google Analytics: Track Begin Checkout
    if (nuxtApp.$ga4 && selectedProduct.value) {
      const plan = selectedPlan.value || 'monthly'
      const calculatedPrice = getVariationPrice(selectedProduct.value, plan) || 0

      nuxtApp.$ga4.trackBeginCheckout(calculatedPrice, [{
        item_id: selectedProduct.value.id || 'unknown',
        item_name: selectedProduct.value.name || 'Weight Loss Program',
        price: calculatedPrice,
        quantity: 1,
      }]);
    }
  }

  if (newStep === 2 && !isStripeLoaded.value) {
    try {
      await loadStripe()
      setStripeLoaded(true)
    } catch (error) {
      if (currentStep.value === 2) {
        console.error('Failed to load Stripe:', error)
      }
    }
  } else if (newStep !== 2) {
    resetStripeLoaded()
    setStripeLoaded(false)
  }
})

// Stripe loading function
const loadStripe = async () => {
  try {
    const { initializeStripe } = useStripe()
    await initializeStripe()
  } catch (error) {
    console.error('Failed to load Stripe:', error)
    throw error
  }
}

// === BNPL FUNCTIONS ===

// Store checkout data before BNPL redirect
const storeCheckoutDataForBNPL = async () => {
  // Clear old localStorage data first to prevent using stale values
  localStorage.removeItem('bnpl_product_data');
  localStorage.removeItem('checkout_step1_data');

  if (!selectedProduct.value) {
    console.error('❌ Cannot store checkout data: missing product')
    return
  }

  const route = useRoute()
  const categoryId_bnpl = route.query.categoryId as string
  const quizId = selectedProduct.value?.quizId || categoryId_bnpl || 'weight-loss'

  const getPlanDescription = (plan: PlanType | null | undefined): string => {
    const planMap: Record<PlanType, string> = {
      'monthly': 'monthly',
      'twoMonthly': '2-month',
      'threeMonthly': '3-month',
      'fourMonthly': '4-month',
      'sixMonthly': '6-month',
      'yearly': '12-month',
    }
    return planMap[plan || 'monthly'] || 'monthly'
  }

  const getPlanPrice = (): number => {
    if (!selectedProduct.value) return 0
    const plan = selectedPlan.value || 'monthly'

    if (bundlePriceOverride.value) {
      return bundlePriceOverride.value
    }

    return getVariationPrice(selectedProduct.value, plan) || 0
  }

  const getProductBundleId = () => {
    if (!selectedProduct.value) return ''
    const plan = selectedPlan.value || 'monthly'
    return getVariationId(selectedProduct.value, plan) || ''
  }

  const finalProductBundleId = getProductBundleId()
  const paymentDescription = `${selectedProduct.value.name} (${getPlanDescription(selectedPlan.value)})`
  const paymentAmount = getPlanPrice()

  // Store simple product data
  const productData = {
    paymentDescription,
    paymentAmount,
    productBundleId: finalProductBundleId
  }
  localStorage.setItem('bnpl_product_data', JSON.stringify(productData))

  // Store full checkout data
  const paymentInfo = {
    paymentDescription,
    paymentAmount,
    shippingAddress: paymentData.value?.shippingAddress || undefined,
    promoCode: (paymentStepRef.value?.promoCode)
      ? paymentStepRef.value.promoCode.trim()
      : undefined
  }

  const checkoutData: any = {
    formAnswers: formAnswers,
    paymentInfo: paymentInfo,
    selectedProductBundleId: finalProductBundleId,
    quizId: quizId,
    timestamp: new Date().toISOString(),
    caseId: undefined
  }

  localStorage.setItem('checkout_step1_data', JSON.stringify(checkoutData))

  // Store query params for restoration after BNPL redirect
  const queryParams: Record<string, string> = {}
  if (route.query.categoryId) {
    queryParams.categoryId = String(route.query.categoryId)
  }
  if (route.query.productId) {
    queryParams.productId = String(route.query.productId)
  }
  if (route.query.promo) {
    queryParams.promo = String(route.query.promo)
  }
  // Preserve UTM parameters
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
  utmParams.forEach(param => {
    if (route.query[param]) {
      queryParams[param] = String(route.query[param])
    }
  })
  // Add any other query params you want to preserve
  if (Object.keys(queryParams).length > 0) {
    sessionStorage.setItem('checkout_query_params', JSON.stringify(queryParams))
  }

}

// Verify and process BNPL payment after redirect
const verifyAndProcessBNPLPayment = async (paymentIntentId: string, paymentIntentClientSecret: string) => {
  if (isSubmittingBNPL.value) {
    return // Prevent duplicate submissions
  }

  isSubmittingBNPL.value = true

  try {
    // Load Stripe if not already loaded
    if (!isStripeLoaded.value) {
      await loadStripe()
      // Wait a bit for Stripe to fully initialize
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Get Stripe instance
    const { stripe } = useStripe()

    // Wait for Stripe to be ready
    let attempts = 0
    while (!stripe.value && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500))
      attempts++
    }

    if (!stripe.value) {
      throw new Error('Stripe not initialized')
    }

    // Retrieve payment intent status using client secret
    // Add timeout to prevent hanging
    const retrievePromise = stripe.value.retrievePaymentIntent(paymentIntentClientSecret)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Payment intent retrieval timed out after 10 seconds')), 10000)
    )

    const result = await Promise.race([retrievePromise, timeoutPromise]) as any

    const paymentStatus = result.paymentIntent?.status

    if (!paymentStatus) {
      throw new Error('Payment intent status not found in response')
    }

    // Only process if payment is succeeded or processing
    if (paymentStatus === 'succeeded' || paymentStatus === 'processing') {
      await handleBNPLPaymentSuccess(paymentIntentId)
    } else {
      isSubmittingBNPL.value = false

      const { useToast } = await import('vue-toastification')
      const toast = useToast()
      toast.error('Payment was not successful. Please try again.')
    }
  } catch (error: any) {
    console.error('❌ Error verifying payment intent:', error)
    isSubmittingBNPL.value = false

    const { useToast } = await import('vue-toastification')
    const toast = useToast()
    toast.error('Unable to verify payment status. Please contact support if payment was successful.')
  }
}

// Handle successful BNPL payment
const handleBNPLPaymentSuccess = async (paymentIntentId: string) => {
  try {
    // Get stored checkout data
    const step1Data = localStorage.getItem('checkout_step1_data')

    if (!step1Data) {
      console.error('❌ No checkout data found for BNPL success')
      console.error('Available localStorage keys:', Object.keys(localStorage))
      isSubmittingBNPL.value = false
      const { useToast } = await import('vue-toastification')
      const toast = useToast()
      toast.error('Checkout data not found. Please contact support.')
      return
    }

    const checkoutData = JSON.parse(step1Data)
    const storedFormAnswers = checkoutData.formAnswers
    const storedPaymentInfo = checkoutData.paymentInfo
    const storedQuizId = checkoutData.quizId || 'weight-loss'

    // Get route first
    const route = useRoute()

    // Get product data from simple storage (set on "Submit to Provider" click)
    const productDataStr = localStorage.getItem('bnpl_product_data')
    let productData = null
    if (productDataStr) {
      try {
        productData = JSON.parse(productDataStr)
      } catch (e) {
        console.warn('⚠️ Could not parse product data')
      }
    } else {
      console.warn('⚠️ [handleBNPLPaymentSuccess] No bnpl_product_data found in localStorage');
    }

    // Use product data if available, otherwise fall back to stored checkout data
    const variationBundleId = productData?.productBundleId || checkoutData.selectedProductBundleId || ''
    const paymentDescription = productData?.paymentDescription || storedPaymentInfo?.paymentDescription || 'BNPL Payment'
    const paymentAmount = productData?.paymentAmount || storedPaymentInfo?.paymentAmount || 0
    const categoryId = route.query.categoryId as string

    // Prepare payment info with BNPL paymentIntentId
    const bnplPaymentInfo = {
      ...storedPaymentInfo,
      paymentDescription,
      paymentAmount,
      stripePaymentIntentId: paymentIntentId,
      stripeSetupId: undefined // BNPL doesn't use SetupIntent
    }

    // Submit form to create case
    const config = useRuntimeConfig()
    const submissionError = ref<string | null>(null)
    const { getQuizById } = await import('~/data/quizConfigs')
    const quiz = await getQuizById(storedQuizId)
    const { submitPatientForm } = await import('~/utils/submitPatientForm')
    const { useToast } = await import('vue-toastification')
    const toast = useToast()

    const response = await submitPatientForm(
      storedFormAnswers,
      ref(quiz?.steps || []),
      config,
      submissionError,
      ref(false),
      bnplPaymentInfo,
      storedQuizId,
      variationBundleId
    )

    // Try multiple possible response structures
    const caseId = (response as any)?.data?.data?.caseId ||
      (response as any)?.data?.caseId ||
      (response as any)?.caseId ||
      (response as any)?.data?.data?.confirmation ||
      (response as any)?.data?.confirmation ||
      (response as any)?.confirmation;

    // Clear checkout data after successful submission
    localStorage.removeItem('checkout_step1_data')
    localStorage.removeItem('bnpl_product_data')

    // If we can't extract caseId, that's okay - submitPatientForm handles navigation automatically
    // Just return early and let the automatic navigation work
    if (!caseId) {
      return;
    }

    // ============================================
    // 10. REDIRECT TO SUCCESS PAGE
    // ============================================
    // Check if shipping address state requires sync
    const restrictedStates = ['NM', 'MS', 'KS', 'WV', 'RI']
    const shippingState = storedPaymentInfo?.shippingAddress?.state
    const needsSync = shippingState && restrictedStates.includes(shippingState)

    // Navigate to welcome page with proper query params
    const welcomeQuery: Record<string, string> = {
      caseId: caseId
    }

    welcomeQuery.categoryId = categoryId || storedQuizId

    if (needsSync) {
      welcomeQuery.showSync = 'true'
    }

    await navigateTo({
      path: '/welcome',
      query: welcomeQuery
    })
  } catch (error: any) {
    console.error('❌ BNPL payment processing failed:', error)

    const { useToast } = await import('vue-toastification')
    const toast = useToast()

    let errorMessage = error.message || 'Failed to process payment. Please try again.'
    if (error.statusCode === 409) {
      errorMessage = 'Please use a unique email and phone number'
    } else if (error.statusCode === 500) {
      errorMessage = 'Something went wrong. Try again later.'
    }

    toast.error(errorMessage)
    isSubmittingBNPL.value = false
  }
}

// === END BNPL FUNCTIONS ===

// OLD PROCESS PAYMENT FUNCTION - REMOVED
// This was causing the issue where payment failures still resulted in form submission
// Now using processPaymentWithConfirmation which properly waits for Stripe confirmation

// Enhanced payment processing with event-based confirmation
const processPaymentWithConfirmation = async () => {
  // Check if this is a BNPL payment FIRST (before validation)
  const isBNPLPayment = (paymentData.value as any)?.paymentType === 'bnpl'

  if (isBNPLPayment) {

    // Store checkout data before BNPL redirect
    await storeCheckoutDataForBNPL()

    // Small delay to ensure localStorage write completes
    await new Promise(resolve => setTimeout(resolve, 100))


    // NOW dispatch the event to trigger BNPL payment (after data is stored)
    const confirmEvent = new CustomEvent('stripe-confirm-bnpl')
    window.dispatchEvent(confirmEvent)


    // Don't set submitting state - BNPL will handle the redirect
    return
  }

  // For card payments, validate before proceeding
  if (isSubmitting.value || !canProcessPayment.value) return

  // Regular card payment flow
  setSubmitting(true)
  setProcessing(true)

  try {
    // Show toast for payment processing
    const { useToast } = await import('vue-toastification')
    const toast = useToast()
    toast.info('Processing payment... Please wait.')

    // Trigger payment confirmation and wait for the result
    const confirmEvent = new CustomEvent('stripe-confirm-setup')
    window.dispatchEvent(confirmEvent)

    // Wait for the actual confirmation result instead of using a timeout
    let confirmedSetupIntentId: string
    try {
      confirmedSetupIntentId = await new Promise<string>((resolve, reject) => {
        const successHandler = (event: Event) => {
          const customEvent = event as CustomEvent
          window.removeEventListener('stripe-confirmation-success', successHandler)
          window.removeEventListener('stripe-confirmation-error', errorHandler)
          resolve(customEvent.detail.setupIntent)
        }

        const errorHandler = (event: Event) => {
          const customEvent = event as CustomEvent
          window.removeEventListener('stripe-confirmation-success', successHandler)
          window.removeEventListener('stripe-confirmation-error', errorHandler)
          reject(new Error(customEvent.detail.error || 'Payment confirmation failed'))
        }

        window.addEventListener('stripe-confirmation-success', successHandler)
        window.addEventListener('stripe-confirmation-error', errorHandler)

        // Add a reasonable timeout (15 seconds) for user experience
        setTimeout(() => {
          window.removeEventListener('stripe-confirmation-success', successHandler)
          window.removeEventListener('stripe-confirmation-error', errorHandler)
          reject(new Error('Payment confirmation timed out after 15 seconds'))
        }, 15000)
      })

      toast.success('Payment confirmed successfully!')

      // Now proceed with form submission
      const { submitPatientForm } = await import('~/utils/submitPatientForm')
      const { getQuizById } = await import('~/data/quizConfigs')
      const config = useRuntimeConfig()
      const submissionError = ref<string | null>(null)

      // Get the completed quiz ID from the product's quizId
      const route = useRoute()
      const categoryId = route.query.categoryId as string
      const completedQuizId = selectedProduct.value?.quizId
        || categoryId
        || 'weight-loss'

      const completedQuiz = await getQuizById(completedQuizId)
      const allStepsMaster = completedQuiz?.steps || []

      // Get the price based on selected plan
      const getPlanPrice = () => {
        if (!selectedProduct.value) return 0
        return getVariationPrice(selectedProduct.value, selectedPlan.value || 'monthly') || 0
      }

      // Prepare dynamic payment information with the CONFIRMED SetupIntent ID
      const paymentInfo = {
        paymentDescription: `${selectedProduct.value?.name} (${selectedPlan.value})`,
        paymentAmount: getPlanPrice(),
        shippingAddress: paymentData.value?.shippingAddress || undefined,
        stripeSetupId: confirmedSetupIntentId,
        promoCode: paymentStepRef.value?.promoCode || undefined
      }

      // Get productBundleId from the selected product's variation for the selected plan
      const selectedProductBundleId = selectedProduct.value
        ? (getVariationId(selectedProduct.value, selectedPlan.value || 'monthly') || '')
        : ''

      // Log the final payload before submission
      // console.log('🚀 Final submission payload:', {
      //   formAnswers,
      //   allStepsMaster: allStepsMaster.length,
      //   paymentInfo,
      //   completedQuizId,
      //   timestamp: new Date().toISOString()
      // })

      // Submit the form with dynamic payment information
      await submitPatientForm(
        formAnswers,
        ref(allStepsMaster),
        config,
        submissionError,
        isSubmitting,
        paymentInfo,
        completedQuizId, // Pass the quiz ID
        selectedProductBundleId // Pass the productBundleId from selected variation
      )

    } catch (confirmationError: any) {
      console.error('❌ Payment confirmation failed:', confirmationError)
      // Re-throw the original error to preserve error.data structure
      throw confirmationError
    }

  } catch (error: any) {
    console.error('❌ Error processing payment:', error)

    // Check for card decline errors that should show BNPL modal
    const errorMessage = error.data?.data?.error || ''
    const errorStr = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
    const isCardDeclined = errorStr.includes('requires_action') || 
                           errorStr.includes('insufficient funds') ||
                           errorStr.includes('card was declined') ||
                           errorStr.includes('exceeding its amount limit')

    if (isCardDeclined) {
      setProcessing(false)
      setSubmitting(false)

      // Remount only the payment element (preserves address) with a fresh SetupIntent
      paymentStepRef.value?.remountPaymentElement()
    } else {
      const { useToast } = await import('vue-toastification')
      const toast = useToast()

      let toastMessage = error.message || 'An error occurred while processing payment. Please try again.'

      if (error.statusCode === 409) {
        toastMessage = 'Please use a unique email and phone number'
      } else if (error.statusCode === 500) {
        toastMessage = 'Something went wrong. Try again later.'
      }

      toast.error(toastMessage)
      
      setProcessing(false)
      setSubmitting(false)

      resetPaymentState()

      // Remount only the payment element (preserves address) with a fresh SetupIntent
      paymentStepRef.value?.remountPaymentElement()
    }
  }
}
</script>