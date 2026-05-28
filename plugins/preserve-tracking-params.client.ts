/**
 * URL Parameter Preservation Plugin
 * Preserves ONLY tracking parameters (UTM, Everflow) during navigation
 * Does NOT store in localStorage - just passes through URL
 */

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return;

  const router = useRouter();

  // List of params to preserve (tracking-related only)
  const PARAMS_TO_PRESERVE = [
    // Everflow tracking
    "_ef_transaction_id",
    "affid",
    "oid",
    "uid",
    "affid2",
    "oid2",
    "uid2",
    "sub1",
    "sub2",
    "sub3",
    "sub4",
    "sub5",
    "source_id",
    // UTM params
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    // Promo codes
    "promo",
  ];

  // Store original push/replace methods
  const originalPush = router.push;
  const originalReplace = router.replace;

  // Helper to get current tracking params from URL
  const getCurrentTrackingParams = () => {
    const currentUrl = new URLSearchParams(window.location.search);
    const trackingParams: Record<string, string> = {};

    PARAMS_TO_PRESERVE.forEach((param) => {
      const value = currentUrl.get(param);
      if (value) trackingParams[param] = value;
    });

    return trackingParams;
  };

  // Override push to append ONLY tracking params
  router.push = function (to: any) {
    const trackingParams = getCurrentTrackingParams();

    if (Object.keys(trackingParams).length > 0) {
      if (typeof to === "string" && !to.includes("?")) {
        const queryString = new URLSearchParams(trackingParams).toString();
        to = `${to}?${queryString}`;
      } else if (typeof to === "object" && to.path) {
        const existingQuery = to.query || {};
        to.query = { ...trackingParams, ...existingQuery };
      }
    }

    return originalPush.call(this, to);
  };

  // Override replace to append ONLY tracking params
  router.replace = function (to: any) {
    const trackingParams = getCurrentTrackingParams();

    if (Object.keys(trackingParams).length > 0) {
      if (typeof to === "string" && !to.includes("?")) {
        const queryString = new URLSearchParams(trackingParams).toString();
        to = `${to}?${queryString}`;
      } else if (typeof to === "object" && to.path) {
        const existingQuery = to.query || {};
        to.query = { ...trackingParams, ...existingQuery };
      }
    }

    return originalReplace.call(this, to);
  };

});
