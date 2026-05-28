/**
 * Injects `x-embed-mode: 1` on every internal `$fetch` call whenever this
 * app is running inside an iframe. The server uses that header to flip to
 * staging CareValidate credentials (see server/utils/envMode.ts) so
 * embedded partner traffic never writes to the production org.
 *
 * Only injected on relative-URL requests (our own `/api/*` endpoints).
 * Third-party fetches are left untouched so we don't leak the header to
 * external APIs.
 */
export default defineNuxtPlugin(() => {
  // SSR-safe guard — this plugin is already client-only per its filename,
  // but be defensive in case the module graph changes.
  if (typeof window === "undefined") return;

  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    // Cross-origin access can throw a SecurityError — that's another way
    // of confirming we're inside a cross-origin iframe.
    embedded = true;
  }

  if (!embedded) return;

  const originalFetch = globalThis.$fetch;
  if (!originalFetch || typeof (originalFetch as any).create !== "function") {
    return;
  }

  const patchedFetch = (originalFetch as any).create({
    onRequest({ request, options }: { request: any; options: any }) {
      const urlStr =
        typeof request === "string"
          ? request
          : request && typeof request.url === "string"
            ? request.url
            : "";

      // Only attach to our own backend. `/` prefix covers `/api/...` routes.
      // Same-origin absolute URLs (matching window.location.origin) also count.
      const isInternal =
        urlStr.startsWith("/") ||
        (typeof urlStr === "string" && urlStr.startsWith(window.location.origin));

      if (!isInternal) return;

      const headers = new Headers((options.headers as HeadersInit) || {});
      headers.set("x-embed-mode", "1");
      options.headers = headers;
    },
  });

  (globalThis as any).$fetch = patchedFetch;
});
