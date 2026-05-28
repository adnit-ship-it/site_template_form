// composables/useEverflow.ts
//
// Everflow event tracking. Event ids + offer id are read from Supabase
// (`site_config.everflow_offer_id` and `site_config.everflow_event_ids`)
// via `useRuntimeConfigDB()`, so each client deployment can configure their
// own ids without code changes.
//
// Firing rules:
//   - If `everflow_offer_id` is empty → nothing ever fires.
//   - If a specific named event isn't in `everflow_event_ids` → that event
//     silently skips. Other events with configured ids still fire.
//   - No defaults, ever. Missing config means no tracking — not "track with
//     a fallback id."
//
// Event name canon (matches the `name` field in `everflow_event_ids`):
//   - "device_capture"
//   - "begin_quiz"
//   - "complete_quiz"
//   - "select_product"
//   - "conversion"
//
// The `$efTrack` and `$efConversion` functions are provided by the
// `plugins/everflow.client.ts` plugin (client-only). On the server side
// the plugin doesn't run, so these will be undefined — every method here
// no-ops in SSR.

// Module-scoped dedup. One firing per page session per dedup-eligible event.
// Cleared on `resetTracking()`. Page reload starts fresh.
const eventTracking = {
  deviceCapture: false,
  beginQuiz: false,
  completeQuiz: false,
  conversion: false,
};

export const useEverflow = () => {
  const nuxtApp = useNuxtApp();
  const { $efTrack, $efConversion } = nuxtApp as unknown as {
    $efTrack?: (eventId: number, extra?: Record<string, any>) => Promise<unknown>;
    $efConversion?: (extra?: Record<string, any>) => Promise<unknown>;
  };
  const runtimeDB = useRuntimeConfigDB();

  /**
   * Looks up a named event in `everflow_event_ids` and fires `$efTrack`
   * only if both the offer id AND the named event are configured. Returns
   * silently in every "not configured" case — no errors, no warnings,
   * no defaults.
   */
  const fireNamedEvent = async (
    name: string,
    extra?: Record<string, any>,
  ): Promise<unknown> => {
    const { everflowOfferId, everflowEventIds } = runtimeDB.value.siteConfig;

    // No offer = no tracking, ever.
    if (!everflowOfferId) return;

    // No matching named event for this client = skip this specific event.
    const event = everflowEventIds.find((e) => e.name === name);
    if (!event?.id) return;

    // SDK not ready (plugin disabled, server-side, etc.) = skip.
    if (typeof $efTrack !== "function") return;

    return $efTrack(event.id, extra);
  };

  return {
    /**
     * Fires once on first page load (call from the plugin once the
     * Everflow SDK is ready). Used for cross-browser email-attribution
     * fingerprinting per the device_capture event in Everflow.
     */
    deviceCapture: async (extra?: Record<string, any>) => {
      if (eventTracking.deviceCapture) return;
      eventTracking.deviceCapture = true;
      return fireNamedEvent("device_capture", extra);
    },

    /** Fires when the user lands on `/consultation`. */
    beginQuiz: async (extra?: Record<string, any>) => {
      if (eventTracking.beginQuiz) return;
      eventTracking.beginQuiz = true;
      return fireNamedEvent("begin_quiz", extra);
    },

    /** Fires when the user finishes the consultation and navigates to /checkout. */
    completeQuiz: async (extra?: Record<string, any>) => {
      if (eventTracking.completeQuiz) return;
      eventTracking.completeQuiz = true;
      return fireNamedEvent("complete_quiz", extra);
    },

    /** Fires when the user completes step 1 of checkout and advances to payment. */
    productSelected: async (extra?: Record<string, any>) => {
      return fireNamedEvent("select_product", extra);
    },

    /**
     * Base conversion — fires after successful payment / case creation.
     * Uses the named "conversion" event id when present; if missing, falls
     * back to the SDK's base $efConversion call (no event_id), which is
     * the legacy behavior. If the offer id is also missing, skips entirely.
     */
    conversion: async (extra?: Record<string, any>) => {
      if (eventTracking.conversion) return;
      const { everflowOfferId, everflowEventIds } = runtimeDB.value.siteConfig;
      if (!everflowOfferId) return;

      eventTracking.conversion = true;

      const conversionEvent = everflowEventIds.find(
        (e) => e.name === "conversion",
      );

      if (conversionEvent?.id && typeof $efTrack === "function") {
        return $efTrack(conversionEvent.id, extra);
      }
      // No named conversion event → fall through to the SDK's base
      // conversion endpoint. Some Everflow setups treat the base call
      // as a conversion record even without an event_id.
      if (typeof $efConversion === "function") {
        return $efConversion(extra);
      }
    },

    /** Resets dedup flags (useful for tests and post-conversion re-runs). */
    resetTracking: () => {
      eventTracking.deviceCapture = false;
      eventTracking.beginQuiz = false;
      eventTracking.completeQuiz = false;
      eventTracking.conversion = false;
    },
  };
};
