// // plugins/everflow.client.ts
// import { useFingerprint } from '~/composables/useFingerprint';

// export default defineNuxtPlugin(async (nuxtApp) => {
//   if (process.server) return;
//   if (process.client && window.location.hostname === 'go.altrx.com') return;

//   // ----------------------------
//   // 1️⃣ Wait for SDK to load (Everflow script is in app.head in nuxt.config)
//   // ----------------------------
//   const waitForEF = (): Promise<void> => {
//     return new Promise((resolve) => {
//       const checkEF = () => {
//         if (window.EF && typeof window.EF.conversion === "function") {
//           resolve();
//         } else {
//           setTimeout(checkEF, 100);
//         }
//       };

//       checkEF();

//       // Warn after 10 seconds
//       setTimeout(() => {
//         if (!window.EF || typeof window.EF.conversion !== "function") {
//           console.warn("[Everflow] SDK not ready after 10s — events will fail");
//         }
//       }, 10000);
//     });
//   };

//   const efReady = waitForEF();

//   // ----------------------------
//   // 🎣 Device Capture (Event 68): Email Attribution Hack
//   // ----------------------------
//   // Fire on fresh clicks to capture device fingerprint for cross-browser attribution
//   efReady.then(async () => {
//     if (window.location.hostname === 'go.altrx.com') return;

//     if (!ensureSDK()) return;

//     const urlParams = new URLSearchParams(window.location.search);
//     const hasOid = urlParams.has('oid');
//     const hasTxnId = urlParams.has('_ef_transaction_id');

//     // Only fire on fresh clicks (when tracking params are present)
//     if (hasOid || hasTxnId) {
//       const { getFingerprint } = useFingerprint();
//       const fingerprint = await getFingerprint();

//       if (fingerprint) {

//         try {
//           await window.EF!.conversion!({
//             tracking_domain: TRACKING_DOMAIN,
//             offer_id: OFFER_ID,
//             event_id: DEVICE_CAPTURE_EVENT_ID,
//             email: fingerprint, // Hijack email field with fingerprint
//           });
//         } catch (error) {
//           console.error('[Everflow] ❌ Device Capture failed:', error);
//         }
//       } else {
//         console.warn('[Everflow] ⚠️ Could not generate fingerprint for Device Capture');
//       }
//     }
//   });

//   // ----------------------------
//   // Helpers
//   // ----------------------------
//   const OFFER_ID = 19;
//   const CASE_EVENT_ID = 64;
//   const DEVICE_CAPTURE_EVENT_ID = 68;
//   const TRACKING_DOMAIN = "https://www.cg6ttm8trk.com";

//   const normalizeExtra = (extra?: Record<string, any>) => {
//     const cleaned = { ...(extra || {}) };

//     // Normalize email if present
//     if (typeof cleaned.email === "string") {
//       const normalized = cleaned.email.trim().toLowerCase();
//       if (normalized) cleaned.email = normalized;
//       else delete cleaned.email;
//     }

//     return cleaned;
//   };
//   const ensureSDK = () => {
//     if (!window.EF || typeof window.EF.conversion !== "function") {
//       return false;
//     }
//     return true;
//   };
//   // ----------------------------
//   // 2️⃣ Event Tracker (with event_id)
//   // ----------------------------
//   const efTrack = async (eventId: number, extra?: Record<string, any>) => {
//     await efReady;

//     if (!ensureSDK()) {
//       console.error("[Everflow] SDK not initialized — event skipped:", eventId);
//       return;
//     }

//     const cleanedExtra = normalizeExtra(extra);

//     // Get transaction_id if not provided
//     if (!cleanedExtra.transaction_id) {
//       const w = window as any;

//       // Try SDK getTransactionId
//       if (w.EF && typeof w.EF.getTransactionId === 'function') {
//         try {
//           let storedTxnId = w.EF.getTransactionId(OFFER_ID);

//           // Poll for up to 5 seconds if not immediately available
//           if (!storedTxnId) {
//             for (let i = 0; i < 25; i++) {
//               await new Promise(resolve => setTimeout(resolve, 200));
//               storedTxnId = w.EF.getTransactionId(OFFER_ID);
//               if (storedTxnId) break;
//             }
//           }

//           if (storedTxnId) {
//             cleanedExtra.transaction_id = storedTxnId;
//           }
//         } catch (e) {
//           console.warn('[Everflow] Failed to retrieve transaction_id:', e);
//         }
//       }

//       // Fallback to sessionStorage
//       if (!cleanedExtra.transaction_id) {
//         const sessionTxnId = sessionStorage.getItem('ef_transaction_id');
//         if (sessionTxnId) {
//           cleanedExtra.transaction_id = sessionTxnId;
//         } else {
//           console.error('[Everflow] No transaction_id found - attribution may fail');
//         }
//       }
//     }

//     // ----------------------------
//     // 🔄 THE SWAP: Email Attribution Hack (for all events)
//     // ----------------------------
//     // Generate fingerprint and swap with real email for cross-browser attribution
//     const { getFingerprint } = useFingerprint();
//     const fingerprint = await getFingerprint();

//     if (fingerprint) {

//       // If real email exists, preserve it in adv1
//       if (cleanedExtra.email) {
//         cleanedExtra.adv1 = cleanedExtra.email;
//       }

//       // Replace email with fingerprint
//       cleanedExtra.email = fingerprint;
//     }

//     const params = {
//       tracking_domain: TRACKING_DOMAIN,
//       offer_id: OFFER_ID,
//       event_id: eventId,
//       ...cleanedExtra,
//     };

//     try {
//       const result = await window.EF!.conversion!(params);
//       return result;
//     } catch (error) {
//       console.error(`[Everflow] Failed to track event ${eventId}:`, error);
//       throw error;
//     }
//   };

//   // ----------------------------
//   // 3️⃣ Base Conversion Tracker (no event_id)
//   // ----------------------------
//   const efConversion = async (extra?: Record<string, any>) => {
//     await efReady;

//     if (!ensureSDK()) {
//       console.error("[Everflow] SDK not initialized — conversion skipped");
//       return;
//     }

//     const cleanedExtra = normalizeExtra(extra);

//     // ----------------------------
//     // 🔄 THE SWAP: Email Attribution Hack
//     // ----------------------------
//     // Generate fingerprint and swap with real email
//     const { getFingerprint } = useFingerprint();
//     const fingerprint = await getFingerprint();

//     if (fingerprint) {

//       // If real email exists, preserve it in adv1
//       if (cleanedExtra.email) {
//         cleanedExtra.adv1 = cleanedExtra.email;
//       }

//       // Replace email with fingerprint
//       cleanedExtra.email = fingerprint;
//     } else {
//       console.warn('[Everflow] ⚠️ Could not generate fingerprint - using real email');
//     }

//     // Get transaction_id if not provided
//     if (!cleanedExtra.transaction_id) {
//       const w = window as any;

//       // Try SDK getTransactionId
//       if (w.EF && typeof w.EF.getTransactionId === 'function') {
//         try {
//           let storedTxnId = w.EF.getTransactionId(OFFER_ID);

//           // Poll for up to 5 seconds if not immediately available
//           if (!storedTxnId) {
//             for (let i = 0; i < 25; i++) {
//               await new Promise(resolve => setTimeout(resolve, 200));
//               storedTxnId = w.EF.getTransactionId(OFFER_ID);
//               if (storedTxnId) break;
//             }
//           }

//           if (storedTxnId) {
//             cleanedExtra.transaction_id = storedTxnId;
//           }
//         } catch (e) {
//           console.warn('[Everflow] Failed to retrieve transaction_id:', e);
//         }
//       }

//       // Fallback to sessionStorage
//       if (!cleanedExtra.transaction_id) {
//         const sessionTxnId = sessionStorage.getItem('ef_transaction_id');
//         if (sessionTxnId) {
//           cleanedExtra.transaction_id = sessionTxnId;
//         } else {
//           console.error('[Everflow] No transaction_id found - attribution may fail');
//         }
//       }
//     }

//     const params = {
//       tracking_domain: TRACKING_DOMAIN,
//       offer_id: OFFER_ID,
//       event_id: CASE_EVENT_ID,
//       ...cleanedExtra,
//     };

//     try {
//       const result = await window.EF!.conversion!(params);
//       return result;
//     } catch (error) {
//       console.error("[Everflow] Failed to track conversion:", error);
//       throw error;
//     }
//   };

//   // ----------------------------
//   // 4️⃣ Expose to app
//   // ----------------------------
//   nuxtApp.provide("efReady", efReady);
//   nuxtApp.provide("efTrack", efTrack);
//   nuxtApp.provide("efConversion", efConversion);
// });
