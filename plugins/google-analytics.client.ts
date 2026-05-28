/**
 * Google Analytics 4 (GA4) plugin.
 *
 * Opt-in per deployment. Provides `$ga4` only when
 * `NUXT_PUBLIC_GA4_MEASUREMENT_ID` is set on the deployment; otherwise the
 * plugin no-ops and all `$ga4` call sites (which already null-check) skip
 * silently. This lets each client report into their own GA4 property — or
 * none at all — without code changes.
 */
export default defineNuxtPlugin(() => {
  const measurementId = useRuntimeConfig().public.ga4MeasurementId;
  if (!measurementId) return;

  // Load gtag.js
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer + gtag shim
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: unknown[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: true,
    page_title: document.title,
    page_location: window.location.href,
  });

  const trackEvent = (
    eventName: string,
    eventParams?: Record<string, unknown>,
  ) => {
    gtag("event", eventName, eventParams ?? {});
  };

  return {
    provide: {
      ga4: {
        trackPurchase: (
          transactionId: string,
          value: number,
          currency = "USD",
          items?: unknown[],
        ) => {
          trackEvent("purchase", {
            transaction_id: transactionId,
            value,
            currency,
            items: items ?? [],
          });
        },

        trackLead: (value?: number) => {
          trackEvent("generate_lead", {
            value: value ?? 0,
            currency: "USD",
          });
        },

        trackBeginCheckout: (value: number, items?: unknown[]) => {
          trackEvent("begin_checkout", {
            value,
            currency: "USD",
            items: items ?? [],
          });
        },

        trackViewItem: (itemId: string, itemName: string, value?: number) => {
          trackEvent("view_item", {
            items: [
              {
                item_id: itemId,
                item_name: itemName,
                price: value ?? 0,
              },
            ],
          });
        },

        trackCustomEvent: (
          eventName: string,
          params?: Record<string, unknown>,
        ) => {
          trackEvent(eventName, params);
        },
      },
    },
  };
});
