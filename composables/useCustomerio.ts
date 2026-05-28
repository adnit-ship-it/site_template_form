// composables/useCustomerio.ts
export const useCustomerio = () => {
  const { $cioanalytics } = useNuxtApp()

  const identify = (userId: string, traits: Record<string, any> = {}) => {
    if (!$cioanalytics) {
      console.warn('[Customer.io] Analytics not initialized')
      return
    }

    try {
      $cioanalytics.identify(userId, traits)
    } catch (error) {
      console.error('[Customer.io] ❌ Failed to identify user:', error)
    }
  }

  const track = (eventName: string, properties: Record<string, any> = {}) => {
    if (!$cioanalytics) {
      console.warn('[Customer.io] Analytics not initialized')
      return
    }

    try {
      $cioanalytics.track(eventName, properties)
    } catch (error) {
      console.error(`[Customer.io] ❌ Failed to track event ${eventName}:`, error)
    }
  }

  // Specific event tracking methods
  const completedQuiz = (email: string, attributes: Record<string, any>) => {
    // Identify user as a lead
    identify(email, {
      email,
      lead: true,
      ...attributes
    })
    
    // Track the event
    track('completed_quiz', { email })
  }

  const selectedProduct = (productType: string) => {
    track('selected_product', {
      product_type: productType
    })
  }

  const selectedBundle = (frequency: string, amount: number) => {
    track('selected_bundle', {
      frequency,
      amount
    })
  }

  const selectedBNPL = () => {
    track('selected_bnpl')
  }

  const selectedCCPayment = () => {
    track('selected_cc_payment')
  }

  const initiatedCheckout = (email: string, amount: number) => {
    track('initiated_checkout', {
      email,
      amount
    })
  }

  const completedPurchase = (email: string, orderId: string, amount: number, caseId: string) => {
    // Update user to customer
    identify(email, {
      customer: true,
      case_id: caseId
    })
    
    // Track the event
    track('completed_purchase', {
      email,
      order_id: orderId,
      amount,
      case_id: caseId
    })
  }

  const failedPurchase = (email: string, amount: number, errorMessage: string) => {
    track('failed_purchase', {
      email,
      amount,
      error: errorMessage
    })
  }

  return {
    identify,
    track,
    completedQuiz,
    selectedProduct,
    selectedBundle,
    selectedBNPL,
    selectedCCPayment,
    initiatedCheckout,
    completedPurchase,
    failedPurchase
  }
}
