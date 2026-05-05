// // plugins/customerio.client.ts
// import { AnalyticsBrowser } from '@customerio/cdp-analytics-browser'

// const noopCio = { identify: () => {}, track: () => {}, page: () => {} }

// export default defineNuxtPlugin((nuxtApp) => {
//   if (process.server) return
//   if (process.client && window.location.hostname === 'go.altrx.com') {
//     nuxtApp.provide('cioanalytics', noopCio)
//     return
//   }

//   const config = useRuntimeConfig()
//   const writeKey = config.public.customerioWriteKey

//   if (!writeKey) {
//     console.warn('[Customer.io] ⚠️ Write Key not configured. Set NUXT_PUBLIC_CUSTOMERIO_WRITE_KEY environment variable.')
//     // Provide a stub to prevent errors
//     nuxtApp.provide('cioanalytics', {
//       identify: () => {},
//       track: () => {},
//       page: () => {}
//     })
//     return
//   }

//   try {
//     const cioanalytics = AnalyticsBrowser.load({
//       writeKey: writeKey
//     })

//     // Expose to app
//     nuxtApp.provide('cioanalytics', cioanalytics)
//   } catch (error) {
//     console.error('[Customer.io Plugin] ❌ Failed to load SDK:', error)
//     // Provide a stub to prevent errors
//     nuxtApp.provide('cioanalytics', {
//       identify: () => {},
//       track: () => {},
//       page: () => {}
//     })
//   }
// })
