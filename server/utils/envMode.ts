import type { H3Event } from "h3";

/**
 * Picks CareValidate credentials and API URLs for a given server request.
 *
 * Two things can flip us to staging:
 *   1. `NODE_ENV=development` (original behaviour — local dev hits staging).
 *   2. The client sent `x-embed-mode: 1`, meaning this request originated
 *      from an iframe-embedded session. We always want embedded sessions to
 *      write to staging so partner integrations never pollute production.
 *
 * The header is set by `plugins/embed-api-headers.client.ts` whenever the
 * client detects it is running inside an iframe.
 *
 * NOTE: the header is trivially spoofable. That is acceptable here because
 * staging is strictly less permissive than prod (test Stripe key, isolated
 * CareValidate org). The worst case is someone fakes the header and writes
 * junk to staging — no data leakage, no prod exposure.
 */
export function resolveEnvMode(event: H3Event) {
  const config = useRuntimeConfig(event);
  const isDevBuild = Boolean(config.public.isDevelopment);
  const embedHeader = getHeader(event, "x-embed-mode");
  const isEmbed = embedHeader === "1" || embedHeader === "true";
  const useStaging = isDevBuild || isEmbed;

  const apiKey = useStaging
    ? (config.careValidateApiKeyStaging as string | undefined)
    : (config.careValidateApiKeyProd as string | undefined);

  // The CareValidate API URL config values point at the API base (.../api/v1).
  // Callers append their specific path (e.g. `/dynamic-case`,
  // `/payments/intent`). `apiHostBase` below is kept as a hardcoded fallback
  // for code that needs the base host even when the env var is missing.
  const apiUrl = useStaging
    ? (config.public.careValidateApiUrlStaging as string | undefined)
    : (config.public.careValidateApiUrlProd as string | undefined);

  const apiHostBase = useStaging
    ? "https://api-staging.care360-next.carevalidate.com/api/v1"
    : "https://api.care360-next.carevalidate.com/api/v1";

  return {
    useStaging,
    isDevBuild,
    isEmbed,
    apiKey,
    apiUrl,
    apiHostBase,
  };
}
