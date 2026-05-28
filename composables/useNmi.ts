import { ref } from "vue";

/**
 * Loads the NMI Collect.js tokenization script.
 *
 * Collect.js reads its tokenization key from the `data-tokenization-key`
 * attribute on its own <script> tag, so the key must be wired in at load
 * time (it cannot be passed to `CollectJS.configure`). This composable
 * injects that script once per page and resolves when it's ready.
 *
 * Used only by the NMI card path (`site_config.use_stripe === false`); the
 * key comes from `useEnvMode().nmiTokenizationKey` (staging vs prod).
 *
 * Mirrors the singleton/SSR-guard style of `useStripe.ts`: the load is
 * shared across callers via a module-level promise so mounting the payment
 * component twice never injects two scripts.
 */

const SCRIPT_SRC = "https://secure.nmi.com/token/Collect.js";

const isNmiScriptLoaded = ref(false);
let loadPromise: Promise<void> | null = null;

export const useNmi = (tokenizationKey: string) => {
  const loadNmiScript = (): Promise<void> => {
    // SSR / non-browser guard — Collect.js is a browser-only global.
    if (typeof window === "undefined" || typeof document === "undefined") {
      return Promise.resolve();
    }

    // Already loaded (this page or a previous mount).
    if (isNmiScriptLoaded.value && (window as any).CollectJS) {
      return Promise.resolve();
    }

    // A load is already in flight — share it.
    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = new Promise<void>((resolve, reject) => {
      if (!tokenizationKey) {
        reject(new Error("Missing NMI tokenization key"));
        return;
      }

      // If a Collect.js tag was somehow injected already, reuse it.
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (existing && (window as any).CollectJS) {
        isNmiScriptLoaded.value = true;
        resolve();
        return;
      }

      const script = existing ?? document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      // The tokenization key MUST be on the script tag itself.
      script.setAttribute("data-tokenization-key", tokenizationKey);

      script.onload = () => {
        isNmiScriptLoaded.value = true;
        resolve();
      };
      script.onerror = () => {
        loadPromise = null; // allow a retry
        reject(new Error("Failed to load NMI Collect.js"));
      };

      if (!existing) {
        document.head.appendChild(script);
      }
    });

    return loadPromise;
  };

  return {
    isNmiScriptLoaded,
    loadNmiScript,
  };
};
