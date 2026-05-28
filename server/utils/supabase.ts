import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  diagnoseSupabaseEnv,
  formatSupabaseEnvHint,
  isValidSupabaseHttpUrl,
} from "~/server/utils/supabaseConfig";

/**
 * Server-only Supabase client factory.
 *
 * Uses the service-role key — it bypasses Row Level Security. This is fine
 * (and intentional) because the server is the trusted boundary that enforces
 * the `org_id` filter on every query via `getCurrentOrgId(event)`. The
 * service-role key MUST stay server-side and is read from
 * `runtimeConfig.supabaseServiceRoleKey`, not from any public slot.
 *
 * The client is memoized per process so we don't pay the construction cost
 * (or open multiple connection pools) on every request. Supabase clients are
 * stateless w.r.t. requests; sharing one across requests is the recommended
 * pattern for server runtimes.
 */
let cached: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (cached) return cached;

  const config = useRuntimeConfig();
  const url = (config.public.supabaseUrl as string | undefined)?.trim();
  const serviceRoleKey = (config.supabaseServiceRoleKey as string | undefined)?.trim();

  const diag = diagnoseSupabaseEnv(url, serviceRoleKey);

  if (!url || !serviceRoleKey) {
    console.warn(
      "[supabase] not configured —",
      formatSupabaseEnvHint(diag),
      diag,
    );
    return null;
  }

  if (!isValidSupabaseHttpUrl(url)) {
    console.warn(
      "[supabase] invalid NUXT_PUBLIC_SUPABASE_URL —",
      formatSupabaseEnvHint(diag),
      diag,
    );
    return null;
  }

  try {
    cached = createClient(url, serviceRoleKey, {
    auth: {
      // No user sessions on the server — we use the service-role key directly.
      // Persisting / refreshing would just leak the key into storage.
      persistSession: false,
      autoRefreshToken: false,
    },
    });
  } catch (err) {
    console.warn("[supabase] createClient failed —", formatSupabaseEnvHint(diag), diag, err);
    return null;
  }

  return cached;
}
