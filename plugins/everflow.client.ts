// plugins/everflow.client.ts
//
// Provides `$efTrack` and `$efConversion` on the Nuxt app context. Both
// pull the Everflow `offer_id` and `tracking_domain` from Supabase
// (`site_config.everflow_offer_id` + `everflow_base_url`) via the
// runtime-config-db plugin / composable — no hardcoded ids, no env vars.
//
// Skip rules:
//   - If `everflow_offer_id` is empty in Supabase, the plugin doesn't
//     register `$efTrack` / `$efConversion`. Calls from `useEverflow()`
//     gracefully no-op because the composable guards on offer_id too.
//   - If the Everflow SDK script never loads or never initializes, the
//     plugin logs once and `$efTrack` / `$efConversion` silently skip.
//
// Initialization side-effect: after the SDK is ready, fires the named
// "device_capture" event once via `useEverflow().deviceCapture()`. The
// composable's own guards apply (offer + device_capture event must both
// be configured).

import { useFingerprint } from "~/composables/useFingerprint";

declare global {
  interface Window {
    EF?: {
      conversion?: (params: Record<string, unknown>) => Promise<unknown>;
      click?: (params: Record<string, unknown>) => Promise<string> | string;
      urlParameter?: (key: string) => string | undefined;
      getTransactionId?: (offerId: number | string) => string | undefined;
    };
  }
}

export default defineNuxtPlugin(async (nuxtApp) => {
  if (import.meta.server) return;

  // Read runtime config (Supabase-backed) for offer + tracking domain.
  // Falls back to DEFAULT_RUNTIME_CONFIG (empty strings) if Supabase isn't
  // wired up yet — which causes us to early-return below.
  const runtimeDB = useRuntimeConfigDB();
  const offerIdRaw = runtimeDB.value.siteConfig.everflowOfferId;
  const trackingDomain = runtimeDB.value.siteConfig.everflowBaseUrl;

  if (!offerIdRaw || !trackingDomain) {
    // No offer or no tracking domain = nothing to do. The composable's
    // guards mirror this so calls to useEverflow().beginQuiz() etc. will
    // silently skip — they never see `$efTrack` undefined as a problem
    // because they check offer_id first.
    return;
  }

  // Everflow's SDK accepts the offer id as a number or numeric string.
  // Coerce here so downstream calls don't have to.
  const offerId = Number(offerIdRaw) || offerIdRaw;

  // ----------------------------
  // 1. Wait for SDK to load
  // ----------------------------
  // The Everflow `<script>` tag is expected to be in `app.head` (see
  // nuxt.config.ts) so it begins loading at the start of the document.
  // We poll briefly until `window.EF.conversion` is callable.
  const waitForEF = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const checkEF = () => {
        if (window.EF && typeof window.EF.conversion === "function") {
          resolve(true);
        } else {
          setTimeout(checkEF, 100);
        }
      };
      checkEF();

      // Hard-warn (not error) at 10s; resolve false so deviceCapture skips
      // instead of hanging forever.
      setTimeout(() => {
        if (!window.EF || typeof window.EF.conversion !== "function") {
          console.warn(
            "[Everflow] SDK not ready after 10s — events will not fire",
          );
          resolve(false);
        }
      }, 10000);
    });
  };

  const efReady = waitForEF();

  const ensureSDK = (): boolean => {
    return Boolean(window.EF && typeof window.EF.conversion === "function");
  };

  const normalizeExtra = (extra?: Record<string, any>) => {
    const cleaned = { ...(extra || {}) };
    if (typeof cleaned.email === "string") {
      const normalized = cleaned.email.trim().toLowerCase();
      if (normalized) cleaned.email = normalized;
      else delete cleaned.email;
    }
    return cleaned;
  };

  /**
   * Resolves a transaction_id for cross-event attribution. Tries the
   * Everflow SDK first, falls back to sessionStorage (populated by
   * everflow-click.client.ts on the initial affiliate click).
   */
  const resolveTransactionId = async (): Promise<string | undefined> => {
    const w = window;

    if (w.EF && typeof w.EF.getTransactionId === "function") {
      let storedTxnId = w.EF.getTransactionId(offerId);

      // Poll up to 5 seconds in case the click handshake is still in flight.
      if (!storedTxnId) {
        for (let i = 0; i < 25; i++) {
          await new Promise((r) => setTimeout(r, 200));
          storedTxnId = w.EF.getTransactionId(offerId);
          if (storedTxnId) break;
        }
      }

      if (storedTxnId) return storedTxnId;
    }

    const sessionTxnId = sessionStorage.getItem("ef_transaction_id");
    if (sessionTxnId) return sessionTxnId;

    return undefined;
  };

  /**
   * THE SWAP: replace `email` with the device fingerprint for
   * cross-browser attribution. Preserves the real email in `adv1` so
   * downstream consumers can still recover it.
   */
  const applyEmailFingerprint = async (cleaned: Record<string, any>) => {
    const { getFingerprint } = useFingerprint();
    const fingerprint = await getFingerprint();
    if (!fingerprint) return;
    if (cleaned.email) cleaned.adv1 = cleaned.email;
    cleaned.email = fingerprint;
  };

  // ----------------------------
  // 2. Event tracker
  // ----------------------------
  const efTrack = async (eventId: number, extra?: Record<string, any>) => {
    const ready = await efReady;
    if (!ready || !ensureSDK()) {
      console.error("[Everflow] SDK not initialized — event skipped:", eventId);
      return;
    }

    const cleaned = normalizeExtra(extra);

    if (!cleaned.transaction_id) {
      const txnId = await resolveTransactionId();
      if (txnId) {
        cleaned.transaction_id = txnId;
      } else {
        console.error("[Everflow] No transaction_id found — attribution may fail");
      }
    }

    await applyEmailFingerprint(cleaned);

    const params = {
      tracking_domain: trackingDomain,
      offer_id: offerId,
      event_id: eventId,
      ...cleaned,
    };

    try {
      return await window.EF!.conversion!(params);
    } catch (error) {
      console.error(`[Everflow] Failed to track event ${eventId}:`, error);
      throw error;
    }
  };

  // ----------------------------
  // 3. Base conversion tracker (no event_id)
  // ----------------------------
  const efConversion = async (extra?: Record<string, any>) => {
    const ready = await efReady;
    if (!ready || !ensureSDK()) {
      console.error("[Everflow] SDK not initialized — conversion skipped");
      return;
    }

    const cleaned = normalizeExtra(extra);
    await applyEmailFingerprint(cleaned);

    if (!cleaned.transaction_id) {
      const txnId = await resolveTransactionId();
      if (txnId) cleaned.transaction_id = txnId;
      else console.error("[Everflow] No transaction_id found — attribution may fail");
    }

    const params = {
      tracking_domain: trackingDomain,
      offer_id: offerId,
      ...cleaned,
    };

    try {
      return await window.EF!.conversion!(params);
    } catch (error) {
      console.error("[Everflow] Failed to track conversion:", error);
      throw error;
    }
  };

  // ----------------------------
  // 4. Expose to app
  // ----------------------------
  nuxtApp.provide("efReady", efReady);
  nuxtApp.provide("efTrack", efTrack);
  nuxtApp.provide("efConversion", efConversion);

  // ----------------------------
  // 5. Device capture (auto-fires on first SDK-ready)
  // ----------------------------
  // The `deviceCapture` method in useEverflow does its own lookup against
  // `everflow_event_ids` — if the client doesn't have a "device_capture"
  // event configured, the call silently no-ops. Either way, this is the
  // only place it auto-fires; everywhere else useEverflow methods are
  // called from explicit user-interaction code paths.
  efReady.then((ready) => {
    if (!ready) return;
    const { deviceCapture } = useEverflow();
    deviceCapture().catch((err) => {
      console.warn("[Everflow] deviceCapture failed (non-critical):", err);
    });
  });
});
