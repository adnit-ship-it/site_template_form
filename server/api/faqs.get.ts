import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const orgId = query.orgId as string

    if (!orgId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Organization ID is required',
        })
    }

    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL
    const supabaseKey = config.public.supabaseAnonKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase credentials missing. URL:', !!supabaseUrl, 'Key:', !!supabaseKey)
        throw createError({
            statusCode: 500,
            statusMessage: 'Server Supabase configuration missing',
        })
    }

    const supabase = createClient(supabaseUrl as string, supabaseKey as string)

    const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('organization_id', orgId)
        .order('order_index', { ascending: true })

    if (error) {
        console.error('Supabase error:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return data
})

