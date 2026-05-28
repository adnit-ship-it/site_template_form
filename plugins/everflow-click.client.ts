/**
 * Everflow Click Tracking Plugin
 *
 * Fires a single `EF.click` on first page load using URL params from the
 * affiliate landing (`?oid=…&affid=…&sub1=…&_ef_transaction_id=…`). The
 * resulting `transaction_id` is stored in sessionStorage for the main
 * Everflow event-tracking plugin to attach to subsequent conversions.
 *
 * Note: this plugin uses the URL-supplied `oid` for the click (the
 * affiliate's offer id from their tracking link) — NOT the Supabase-
 * configured `everflow_offer_id`. Those are different concepts:
 *   - URL `oid`: who sent the user here (affiliate attribution)
 *   - Supabase `offer_id`: this site's own Everflow offer for conversion events
 */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  const run = () => {
    const w = window as Window & {
      __ef_click_fired?: boolean;
    };

    if (!w.EF || typeof w.EF.click !== "function") {
      console.warn("[Everflow Click] Everflow SDK not ready yet");
      return false;
    }

    if (w.__ef_click_fired) {
      return true;
    }
    w.__ef_click_fired = true;

    const clickParams = {
      tracking_domain: "https://www.cg6ttm8trk.com",
      offer_id: w.EF.urlParameter?.("oid"),
      affiliate_id: w.EF.urlParameter?.("affid"),
      sub1: w.EF.urlParameter?.("sub1"),
      sub2: w.EF.urlParameter?.("sub2"),
      sub3: w.EF.urlParameter?.("sub3"),
      sub4: w.EF.urlParameter?.("sub4"),
      sub5: w.EF.urlParameter?.("sub5"),
      uid: w.EF.urlParameter?.("uid"),
      transaction_id: w.EF.urlParameter?.("_ef_transaction_id"),
    };

    const clickResult = w.EF.click!(clickParams);

    if (clickResult && typeof (clickResult as Promise<string>).then === "function") {
      (clickResult as Promise<string>)
        .then((transaction_id: string) => {
          if (transaction_id) {
            sessionStorage.setItem("ef_transaction_id", transaction_id);
          }
        })
        .catch((err: unknown) => {
          console.error("[Everflow Click] Click promise rejected:", err);
        });
    } else if (typeof w.EF.getTransactionId === "function") {
      setTimeout(() => {
        const retrievedId = w.EF!.getTransactionId!(clickParams.offer_id as string);
        if (retrievedId) {
          sessionStorage.setItem("ef_transaction_id", retrievedId);
        }
      }, 500);
    }

    return true;
  };

  // Try immediately, then retry briefly until Everflow SDK is ready.
  if (run()) return;

  let tries = 0;
  const t = window.setInterval(() => {
    tries++;
    if (run() || tries > 40) {
      if (tries > 40) {
        console.error(
          "[Everflow Click] SDK not ready after 4 seconds — script failed to load or initialize",
        );
      }
      window.clearInterval(t);
    }
  }, 100);
});
