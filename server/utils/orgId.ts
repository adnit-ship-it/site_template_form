import type { H3Event } from "h3";

/**
 * Resolves the org_id used to scope every Supabase read for the current
 * deployment.
 *
 * Phase 1 is single-deployment-per-org: each Vercel project is stamped at
 * build time with `NUXT_PUBLIC_ORG_ID` and that value flows through
 * `runtimeConfig.public.orgId`. Every server route that touches Supabase
 * calls this helper to get the id, then includes it in the `WHERE` clause.
 *
 * A future multi-tenant gateway (one deployment serving many orgs by
 * subdomain or header) would change this function to derive the id from
 * `event.context` / `event.node.req.headers`. Callers don't need to change.
 *
 * Returns `null` when the env var isn't set yet (e.g. on a fresh checkout
 * before Supabase is provisioned). Callers should treat null as "fall back
 * to default runtime config".
 */
export function getCurrentOrgId(_event?: H3Event): string | null {
  const config = useRuntimeConfig();
  const orgId = (config.public.orgId as string | undefined)?.trim();
  if (!orgId) return null;
  return orgId;
}
