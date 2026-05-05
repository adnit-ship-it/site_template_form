export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) return

  const router = useRouter()

  router.beforeEach((to, from, next) => {
    // Check if we are on checkout AND coming back from Stripe (has payment_intent)
    if (to.path === '/checkout' && to.query.payment_intent) {
      // Check if we have lost our original state (e.g. missing categoryId or productId)
      const hasAppState = to.query.categoryId || to.query.productId

      if (!hasAppState) {
        let restoredQuery: Record<string, string> = {}

        // Retrieve stored state
        if (typeof window !== 'undefined') {
          const storedParams = sessionStorage.getItem('checkout_query_params')
          if (storedParams) {
            try {
              restoredQuery = JSON.parse(storedParams)
            } catch (e) {
              console.error('❌ Plugin: Failed to parse stored checkout query params', e)
            }
          } else {
            console.warn('⚠️ Plugin: No checkout_query_params found in sessionStorage')
          }
        }

        // Only proceed if we actually have restored params to merge
        if (Object.keys(restoredQuery).length > 0) {
          // Merge: Restored App State + Current Stripe Params
          // Important: Stripe params take precedence to ensure we keep payment_intent, etc.
          const finalQuery = {
            ...restoredQuery,
            ...to.query // Keep Stripe params (payment_intent, redirect_status, payment_intent_client_secret)
          }

          // Check if we're actually adding missing app state params
          // Compare ORIGINAL to.query (not merged finalQuery) against what we're restoring
          const willAddAppState = (!to.query.categoryId && restoredQuery.categoryId) ||
            (!to.query.productId && restoredQuery.productId)

          // Only redirect if we're adding app state AND the query will actually change
          if (willAddAppState) {
            // Clean up sessionStorage BEFORE redirect to prevent re-processing
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('checkout_query_params')
            }

            next({
              path: '/checkout',
              query: finalQuery,
              replace: true // Replace history entry so back button works better
            })
            return
          } else {
          }
        } else {
          console.warn('⚠️ Plugin: No restored params to merge, continuing without redirect')
        }
      } else {
      }
    } else {
    }

    next()
  })
})

