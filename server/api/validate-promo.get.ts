export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string
  const productBundleId = query.product_bundle_id as string | undefined

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required parameter: code' })
  }

  const config = useRuntimeConfig()
  const apiKey = config.careValidateApiKey

  const promoUrl = 'https://api.care360-next.carevalidate.com/api/v1/promo-codes'

  const params = new URLSearchParams({ code })
  if (productBundleId) params.set('product_bundle_id', productBundleId)

  try {
    const response = await $fetch(`${promoUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'cv-api-key': apiKey,
      },
    })
    return { success: true, data: response }
  } catch (error: any) {
    console.error('❌ Promo validation error:', {
      statusCode: error.statusCode,
      statusMessage: error.statusMessage,
      data: error.data,
      message: error.message,
    })
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to validate promo code.',
      data: error.data,
    })
  }
})
