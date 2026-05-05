// /**
//  * Google Analytics 4 (GA4) Plugin
//  * Measurement ID: G-3H9L5298TG
//  */
// export default defineNuxtPlugin(() => {
//   if (process.server) return;
//   if (process.client && window.location.hostname === 'go.altrx.com') return;

//   const measurementId = 'G-3H9L5298TG';

//   // Load gtag.js script
//   const script = document.createElement('script');
//   script.async = true;
//   script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
//   document.head.appendChild(script);

//   // Initialize dataLayer
//   (window as any).dataLayer = (window as any).dataLayer || [];
//   function gtag(...args: any[]) {
//     (window as any).dataLayer.push(arguments);
//   }
//   (window as any).gtag = gtag;

//   // Configure GA4
//   gtag('js', new Date());
//   gtag('config', measurementId, {
//     send_page_view: true,
//     // Enhanced measurement
//     page_title: document.title,
//     page_location: window.location.href,
//   });


//   // Helper function for conversion events
//   const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
//     if (typeof gtag === 'function') {
//       gtag('event', eventName, eventParams || {});
//     }
//   };

//   // Provide helper methods to app
//   return {
//     provide: {
//       ga4: {
//         // Track purchase conversion
//         trackPurchase: (transactionId: string, value: number, currency: string = 'USD', items?: any[]) => {
//           trackEvent('purchase', {
//             transaction_id: transactionId,
//             value: value,
//             currency: currency,
//             items: items || [],
//           });
//         },

//         // Track lead generation (quiz completion)
//         trackLead: (value?: number) => {
//           trackEvent('generate_lead', {
//             value: value || 0,
//             currency: 'USD',
//           });
//         },

//         // Track checkout begin
//         trackBeginCheckout: (value: number, items?: any[]) => {
//           trackEvent('begin_checkout', {
//             value: value,
//             currency: 'USD',
//             items: items || [],
//           });
//         },

//         // Track product view
//         trackViewItem: (itemId: string, itemName: string, value?: number) => {
//           trackEvent('view_item', {
//             items: [{
//               item_id: itemId,
//               item_name: itemName,
//               price: value || 0,
//             }],
//           });
//         },

//         // Track custom event
//         trackCustomEvent: (eventName: string, params?: Record<string, any>) => {
//           trackEvent(eventName, params);
//         },
//       },
//     },
//   };
// });
