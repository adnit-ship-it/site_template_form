import { ref, computed, toRef } from 'vue'
import type { Category, Product, PlanType } from '~/types/checkout'
import { getVariationPrice, getVariationId, hasVariation } from '~/types/checkout'
import { categories } from '~/data/products'
import { usePatientForm } from '~/composables/usePatientForm'
import { scrollToTop } from '~/utils/scrollToTop'

interface AddressInfo {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
}

export function useCheckout() {
  // --- STATE ---
  const currentStep = ref(1)
  const selectedCategory = ref<Category | null>(null)
  const selectedProduct = ref<Product | null>(null)
  const selectedPlan = ref<PlanType>('monthly')
  const paymentData = ref<{
    stripeSetupId?: string | null
    stripePaymentIntentId?: string | null
    paymentType?: 'card' | 'bnpl'
    shippingAddress: AddressInfo | null
  } | null | undefined>(null)
  const isStripeLoaded = ref(false)
  const isProcessing = ref(false)
  const isSubmitting = ref(false)

  // Get form data from the form state instead of localStorage
  const { formAnswers } = usePatientForm()

  // --- COMPUTED ---
  const canProcessPayment = computed(() => {
    // Allow processing when form is ready for payment OR when we have a confirmed SetupIntent ID
    const hasFormReady = paymentData.value?.stripeSetupId === 'ready'
    const hasConfirmedPayment = paymentData.value?.stripeSetupId &&
      paymentData.value.stripeSetupId !== 'ready' &&
      paymentData.value.stripeSetupId.startsWith('seti_')

    const canProcess = selectedCategory.value && selectedProduct.value && (hasFormReady || hasConfirmedPayment)

    return canProcess
  })

  const currentStepData = computed(() => {
    switch (currentStep.value) {
      case 1:
        return { title: 'Select Product & Frequency', description: 'Choose your medication and plan' }
      case 2:
        return { title: 'Payment', description: 'Complete your payment' }
      default:
        return { title: '', description: '' }
    }
  })

  // --- METHODS ---
  const selectCategory = (category: Category) => {
    if (isSubmitting.value) return
    selectedCategory.value = category
    selectedProduct.value = null
  }

  const selectProduct = (product: Product) => {
    if (isSubmitting.value) return
    selectedProduct.value = product
  }

  const selectPlan = (plan: PlanType) => {
    if (isSubmitting.value) return
    selectedPlan.value = plan
  }

  const goBack = () => {
    if (isSubmitting.value) return
    if (currentStep.value > 1) {
      currentStep.value--
      scrollToTop()
    } else {
      if (process.client) {
        window.history.back()
      } else {
        // Fallback for SSR
        navigateTo('/')
      }
    }
  }

  const prevStep = () => {
    if (isSubmitting.value) return
    if (currentStep.value > 1) {
      // If going back from payment step, reset payment state to ensure fresh SetupIntent on return
      if (currentStep.value === 2) {
        resetPaymentState()
      }
      currentStep.value--
      scrollToTop()
    }
  }

  const nextStep = (scrollToTopCallback?: () => void) => {
    if (isSubmitting.value) return

    if (currentStep.value === 1) {
      // Step 1 → Step 2: Product Selection (with Frequency Selector) → Payment
      // Require selectedProduct to proceed
      if (!selectedProduct.value) return

      // Store selected product in localStorage
      if (process.client) {
        localStorage.setItem('selectedProduct', JSON.stringify(selectedProduct.value))
      }
      currentStep.value = 2
      scrollToTop()

      // Call scrollToTop callback if provided (for mobile compatibility)
      if (scrollToTopCallback) {
        setTimeout(() => scrollToTopCallback(), 50)
      }
    }
  }

  const loadStoredData = () => {
    if (process.client) {
      // Load selected category from localStorage
      const storedCategory = localStorage.getItem('selectedCategory')
      if (storedCategory) {
        selectedCategory.value = JSON.parse(storedCategory)
      }

      // Load selected product from localStorage
      const storedProduct = localStorage.getItem('selectedProduct')
      if (storedProduct) {
        selectedProduct.value = JSON.parse(storedProduct)
      }

      // Form data is now managed by usePatientForm, no need to load from localStorage
    }

    // If no category selected, set default category (weight-loss)
    if (!selectedCategory.value) {
      const defaultCategory = categories.find(p => p.id === 'weight-loss') || categories[0]
      if (defaultCategory) {
        selectedCategory.value = defaultCategory
      }
    }
  }

  const handlePaymentUpdate = (data: {
    stripeSetupId?: string | null
    stripePaymentIntentId?: string | null
    paymentType?: 'card' | 'bnpl'
    shippingAddress: AddressInfo | null
  } | null | undefined) => {
    paymentData.value = data
  }

  const handleFormAnswersUpdate = (updates: { email?: string; phone?: string; consent?: string }) => {
    // Update the formAnswers object with the new values
    if (updates.email !== undefined) {
      formAnswers.email = updates.email
    }
    if (updates.phone !== undefined) {
      formAnswers.phone = updates.phone
    }
    if (updates.consent !== undefined) {
      formAnswers.consent = updates.consent
    }
  }

  const resetStripeLoaded = () => {
    isStripeLoaded.value = false
  }

  const setStripeLoaded = (loaded: boolean) => {
    isStripeLoaded.value = loaded
  }

  const setSubmitting = (submitting: boolean) => {
    isSubmitting.value = submitting
  }

  const setProcessing = (processing: boolean) => {
    isProcessing.value = processing
  }

  const clearCheckoutData = () => {
    if (process.client) {
      localStorage.removeItem('selectedCategory')
      localStorage.removeItem('selectedProduct')

      // Clear universal ID upload
      localStorage.removeItem('universal_id_upload')

      // Clear all quiz completion flags
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('quiz_') && key.endsWith('_completed')) {
          localStorage.removeItem(key)
        }
      }
    }
  }

  const resetPaymentState = () => {
    // Reset payment state while preserving shipping address
    // This ensures a fresh SetupIntent is created on next submission attempt
    // to prevent reuse of already confirmed SetupIntent IDs
    if (paymentData.value) {
      paymentData.value = {
        stripeSetupId: null,
        stripePaymentIntentId: null,
        shippingAddress: paymentData.value.shippingAddress
      }
    }
  }

  // Utility function to check if a specific quiz has been completed
  const isQuizCompleted = (quizId: string): boolean => {
    if (!process.client) return false
    return localStorage.getItem(`quiz_${quizId}_completed`) === 'true'
  }

  const getRequiredQuizId = (categoryId?: string): string | null => {
    if (categoryId) {
      return categoryId
    }
    return null
  }

  return {
    // State
    currentStep,
    selectedCategory,
    selectedProduct,
    selectedPlan,
    paymentData,
    isStripeLoaded,
    isProcessing,
    isSubmitting,
    formAnswers,

    // Computed
    canProcessPayment,
    currentStepData,

    // Methods
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

    // Utility functions
    isQuizCompleted,
    getRequiredQuizId
  }
}
