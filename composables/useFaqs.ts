/**
 * Composable for fetching dynamic FAQs from Supabase
 * 
 * Usage:
 * const { faqs, loading, error, refresh } = useFaqs(defaultFaqs)
 */

export interface FAQItem {
  question: string;
  answer: string;
}

export const useFaqs = (defaultFaqs: FAQItem[] = []) => {
  const config = useRuntimeConfig()
  const orgId = config.public.organizationId

  const faqs = ref<FAQItem[]>(defaultFaqs)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchFaqs = async () => {
    if (!orgId) {
      console.warn('Organization ID not found in runtime config, using default FAQs')
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await $fetch('/api/faqs', {
        query: { orgId }
      })

      if (data && Array.isArray(data) && data.length > 0) {
        faqs.value = data.map((item: any) => ({
          question: item.question,
          answer: item.answer,
        }))
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch FAQs'
      // Keep default FAQs on error
    } finally {
      loading.value = false
    }
  }

  // Fetch on client mount only to avoid hydration issues
  onMounted(() => {
    fetchFaqs()
  })

  return {
    faqs: readonly(faqs),
    loading: readonly(loading),
    error: readonly(error),
    refresh: fetchFaqs,
  }
}

