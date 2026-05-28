import type { CommonData } from "~/data/common-helpers";
import type { ComputedRef } from "vue";

/**
 * Supabase-backed brand/copy (from `site_branding` via `/api/runtime-config`).
 * Populated before first paint by `plugins/00.site-bootstrap.ts`.
 */
export function useCommon(): ComputedRef<CommonData> {
  return computed(() => useRuntimeConfigDB().value.branding);
}
