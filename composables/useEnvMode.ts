import { computed } from "vue";
import { useIsEmbedded } from "~/composables/useIsEmbedded";

/**
 * Client-side selector for "which environment am I talking to?"
 *
 * Two things flip us to staging:
 *   1. The build was made with `NODE_ENV=development` (existing behaviour).
 *   2. We're currently running inside an iframe embed — we want embedded
 *      partner traffic to always land in staging so no real cases are
 *      created until an integration is fully validated.
 *
 * Returns reactive refs so any consumer re-evaluates if embed status
 * changes (it flips from `false` to `true` right after `onMounted`).
 *
 * Server-side endpoints have their own equivalent in
 * `server/utils/envMode.ts`; the client informs them by sending
 * `x-embed-mode: 1` on API calls (see plugins/embed-api-headers.client.ts).
 */
export const useEnvMode = () => {
  const cfg = useRuntimeConfig().public;
  const isEmbedded = useIsEmbedded();
  const isDevBuild = Boolean(cfg.isDevelopment);

  const useStaging = computed(() => isDevBuild || isEmbedded.value);

  const stripePublishableKey = computed(() => {
    return (useStaging.value
      ? cfg.stripePublishableKeyStaging
      : cfg.stripePublishableKeyProd) as string;
  });

  const careValidateApiUrl = computed(() => {
    return (useStaging.value
      ? cfg.careValidateApiUrlStaging
      : cfg.careValidateApiUrlProd) as string;
  });

  return {
    isEmbedded,
    isDevBuild,
    useStaging,
    stripePublishableKey,
    careValidateApiUrl,
  };
};
