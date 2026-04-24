// /**
//  * Everflow Click Tracking Plugin
//  * Single click to main advertiser domain (cg6ttm8trk.com).
//  */
// export default defineNuxtPlugin(() => {
//   if (process.server) return;
//   if (process.client && window.location.hostname === 'go.altrx.com') return;

//   const run = () => {
//     const w = window as any;

//     if (!w.EF || typeof w.EF.click !== "function") {
//       console.warn('[Everflow Click] Everflow SDK not ready yet');
//       return false;
//     }

//     if (w.__ef_click_fired) {
//       return true;
//     }
//     w.__ef_click_fired = true;

//     const clickParams = {
//       tracking_domain: "https://www.cg6ttm8trk.com",
//       offer_id: w.EF.urlParameter("oid"),
//       affiliate_id: w.EF.urlParameter("affid"),
//       sub1: w.EF.urlParameter("sub1"),
//       sub2: w.EF.urlParameter("sub2"),
//       sub3: w.EF.urlParameter("sub3"),
//       sub4: w.EF.urlParameter("sub4"),
//       sub5: w.EF.urlParameter("sub5"),
//       uid: w.EF.urlParameter("uid"),
//       transaction_id: w.EF.urlParameter("_ef_transaction_id"),
//     };
    
    
//     const clickResult = w.EF.click(clickParams);
    
//     if (clickResult && typeof clickResult.then === 'function') {
//       clickResult.then((transaction_id: string) => {
//         // Store in sessionStorage for later retrieval
//         if (transaction_id) {
//           sessionStorage.setItem('ef_transaction_id', transaction_id);
//         }
//       }).catch((err: any) => {
//         console.error('[Everflow Click] ❌ Click promise rejected:', err);
//       });
//     } else {
//       // If no promise, try to get transaction_id immediately from SDK
//       if (typeof w.EF.getTransactionId === 'function') {
//         setTimeout(() => {
//           const retrievedId = w.EF.getTransactionId(clickParams.offer_id);
//           if (retrievedId) {
//             sessionStorage.setItem('ef_transaction_id', retrievedId);
//           }
//         }, 500);
//       }
//     }

//     return true
//   }

//   // Try immediately, then retry briefly until Everflow SDK is ready
//   if (run()) return
  
//   let tries = 0
//   const t = window.setInterval(() => {
//     tries++
//     if (run() || tries > 40) {
//       if (tries > 40) {
//         console.error('[Everflow Click] ❌ SDK not ready after 4 seconds');
//         console.error('[Everflow Click] This means the Everflow script failed to load or initialize');
//       } else {
//         console.log('[Everflow Click] ✅ SDK ready after', tries * 100, 'ms');
//       }
//       window.clearInterval(t);
//     }
//   }, 100)
// })
