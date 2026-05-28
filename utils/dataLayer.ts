/**
 * Safe helper for pushing events into the GTM `window.dataLayer`.
 *
 * The GTM snippet itself may currently be disabled (see `nuxt.config.ts`) and
 * the `$googleTagManager` / `$ga4` plugins are commented out. Pushing into
 * `window.dataLayer` directly is still the correct thing to do: GTM picks up
 * the existing array whenever it is enabled, and in the meantime the events
 * are observable in the browser for QA / tag previews without requiring the
 * plugins.
 *
 * Usage:
 *   pushDataLayer({ event: 'QUIZ_START' })
 *   pushDataLayer({ event: 'click_continue', form_progress: 3, ... })
 */
export interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

export function pushDataLayer(payload: DataLayerEvent): void {
  if (typeof window === "undefined") return;

  const w = window as unknown as { dataLayer?: DataLayerEvent[] };
  if (!Array.isArray(w.dataLayer)) {
    w.dataLayer = [];
  }
  w.dataLayer.push(payload);
}
