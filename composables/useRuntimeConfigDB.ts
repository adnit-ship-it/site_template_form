import { DEFAULT_RUNTIME_CONFIG, type RuntimeConfigDB } from "~/types/runtime-config";

/**
 * Synchronous accessor for the Supabase-backed runtime config.
 *
 * The actual fetch happens once per page load in
 * `plugins/00.site-bootstrap.ts`, which stores the result in a Nuxt
 * `useState` slot. Consumers (Vue components, composables, utils running
 * inside the Nuxt request scope) call `useRuntimeConfigDB()` to read that
 * shared state synchronously — no `await`, no network.
 *
 * Returns a `Ref<RuntimeConfigDB>`. In templates Vue auto-unwraps it
 * (`runtimeDB.siteConfig.bnplActivated`); in script use `.value`.
 *
 * If the plugin somehow didn't populate state (initial frame, plugin
 * disabled, SSR-only edge), the ref is initialized with
 * `DEFAULT_RUNTIME_CONFIG` so reads never throw and the app degrades
 * gracefully to the pre-Supabase behavior.
 */
export function useRuntimeConfigDB() {
  return useState<RuntimeConfigDB>(
    "runtime-config-db",
    () => DEFAULT_RUNTIME_CONFIG,
  );
}
