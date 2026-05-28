/**
 * Logging for `/api/runtime-config` and site bootstrap.
 *
 * - Fallback paths always emit `console.warn` (visible in Vercel production logs).
 * - Detail logs emit when `import.meta.dev` or `DEBUG_RUNTIME_CONFIG=1` on the server.
 * - Client plugin detail when `NUXT_PUBLIC_DEBUG_SITE_BOOTSTRAP=1`.
 */
export function isServerRuntimeConfigVerbose(): boolean {
  if (import.meta.dev) return true;
  return process.env.DEBUG_RUNTIME_CONFIG === "1" || process.env.DEBUG_RUNTIME_CONFIG === "true";
}

export function runtimeConfigWarn(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.warn(message, detail);
  } else {
    console.warn(message);
  }
}

export function runtimeConfigInfo(message: string, detail?: unknown): void {
  if (!isServerRuntimeConfigVerbose()) return;
  if (detail !== undefined) {
    console.info(message, detail);
  } else {
    console.info(message);
  }
}
