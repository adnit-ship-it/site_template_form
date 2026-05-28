import { getServerSupabase } from "~/server/utils/supabase";
import { getCurrentOrgId } from "~/server/utils/orgId";
import { mapSiteBrandingRow } from "~/server/utils/mapSiteBranding";
import {
  runtimeConfigInfo,
  runtimeConfigWarn,
} from "~/server/utils/runtimeConfigLog";
import { DEFAULT_BRANDING } from "~/data/default-branding";
import {
  DEFAULT_RUNTIME_CONFIG,
  type AnnouncementConfig,
  type RuntimeConfigDB,
  type SiteConfig,
} from "~/types/runtime-config";

/**
 * Returns the runtime config (site_config + announcement + site_branding) for the current
 * deployment's org_id. Cached for 60s in the Nitro storage layer — every
 * page request shares the same cached read until either:
 *   - The TTL expires, or
 *   - `/api/runtime-config/invalidate` is called (typically by a Supabase
 *     Database Webhook on row update; see docs/SUPABASE_WEBHOOKS.md).
 *
 * On any failure (Supabase unreachable, missing row, missing env vars)
 * returns `DEFAULT_RUNTIME_CONFIG` so the app never blanks out. Errors
 * are logged once per cache-miss; the next miss re-attempts.
 */
export default defineCachedEventHandler(
  async (event): Promise<RuntimeConfigDB> => {
    const runtimeCfg = useRuntimeConfig();
    const requireDbBranding =
      runtimeCfg.public.requireDbBranding === true ||
      runtimeCfg.public.requireDbBranding === "1" ||
      runtimeCfg.public.requireDbBranding === "true";

    const failOrFallback = (message: string): RuntimeConfigDB => {
      if (requireDbBranding) {
        throw createError({
          statusCode: 500,
          statusMessage: message,
        });
      }
      runtimeConfigWarn(message);
      return DEFAULT_RUNTIME_CONFIG;
    };

    const orgId = getCurrentOrgId(event);
    if (!orgId) {
      return failOrFallback(
        "[runtime-config] FALLBACK: NUXT_PUBLIC_ORG_ID is not set — using DEFAULT_BRANDING (data/common.json). Set NUXT_PUBLIC_ORG_ID to your site_branding.org_id (e.g. acuwellmd).",
      );
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      return failOrFallback(
        `[runtime-config] FALLBACK: Supabase client unavailable (check NUXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) — org_id="${orgId}" — using DEFAULT_BRANDING.`,
      );
    }

    runtimeConfigInfo(
      `[runtime-config] cache miss — fetching from Supabase for org_id="${orgId}"`,
    );

    try {
      const [siteConfigResult, announcementResult, brandingResult] = await Promise.all([
        supabase
          .from("site_config")
          .select(
            "bnpl_activated, home_url, use_new_api, use_stripe, everflow_base_url, everflow_offer_id, everflow_event_ids, default_quiz_id_override",
          )
          .eq("org_id", orgId)
          .maybeSingle(),
        supabase
          .from("announcement")
          .select("enabled, text, background_color, text_color")
          .eq("org_id", orgId)
          .maybeSingle(),
        supabase
          .from("site_branding")
          .select("org_name, site_title, page_description, colors, default_quiz_id")
          .eq("org_id", orgId)
          .maybeSingle(),
      ]);

      if (siteConfigResult.error) {
        console.error(
          "[runtime-config] site_config select failed:",
          siteConfigResult.error.message,
        );
      }
      if (announcementResult.error) {
        console.error(
          "[runtime-config] announcement select failed:",
          announcementResult.error.message,
        );
      }
      if (brandingResult.error) {
        console.error(
          "[runtime-config] site_branding select failed:",
          brandingResult.error.message,
        );
      }

      runtimeConfigInfo("[runtime-config] raw site_config row:", siteConfigResult.data);
      runtimeConfigInfo("[runtime-config] raw announcement row:", announcementResult.data);
      runtimeConfigInfo("[runtime-config] raw site_branding row:", brandingResult.data);

      if (!brandingResult.data) {
        if (requireDbBranding) {
          throw createError({
            statusCode: 500,
            statusMessage: `[runtime-config] site_branding: NO ROW for org_id="${orgId}"`,
          });
        }
        runtimeConfigWarn(
          `[runtime-config] site_branding: NO ROW for org_id="${orgId}" — using DEFAULT_BRANDING (${DEFAULT_BRANDING.brand?.orgName}). Confirm a site_branding row exists with matching org_id.`,
        );
      } else {
        runtimeConfigInfo(
          `[runtime-config] site_branding OK — org_id="${orgId}" org_name="${brandingResult.data.org_name}" site_title="${brandingResult.data.site_title}" colors=${JSON.stringify(brandingResult.data.colors ?? {})}`,
        );
      }

      // snake_case (DB) → camelCase (app contract). Missing rows fall back
      // to the per-field defaults so a partial row still renders something.
      const siteConfig: SiteConfig = {
        bnplActivated:
          siteConfigResult.data?.bnpl_activated ??
          DEFAULT_RUNTIME_CONFIG.siteConfig.bnplActivated,
        homeUrl:
          siteConfigResult.data?.home_url ??
          DEFAULT_RUNTIME_CONFIG.siteConfig.homeUrl,
        useNewAPI:
          siteConfigResult.data?.use_new_api ??
          DEFAULT_RUNTIME_CONFIG.siteConfig.useNewAPI,
        useStripe:
          siteConfigResult.data?.use_stripe ??
          DEFAULT_RUNTIME_CONFIG.siteConfig.useStripe,
        everflowBaseUrl:
          siteConfigResult.data?.everflow_base_url ??
          DEFAULT_RUNTIME_CONFIG.siteConfig.everflowBaseUrl,
        everflowOfferId:
          siteConfigResult.data?.everflow_offer_id ??
          DEFAULT_RUNTIME_CONFIG.siteConfig.everflowOfferId,
        // `everflow_event_ids` is a jsonb array in Supabase — Postgres returns
        // it pre-parsed as a JS array. The shape (`[{name,id}, …]`) is
        // enforced informally by docs/SUPABASE_SCHEMA.md and the
        // `EverflowEvent` TypeScript type; the DB-level CHECK only enforces
        // "is an array."
        everflowEventIds:
          siteConfigResult.data?.everflow_event_ids ??
          DEFAULT_RUNTIME_CONFIG.siteConfig.everflowEventIds,
        defaultQuizIdOverride:
          siteConfigResult.data?.default_quiz_id_override ?? null,
      };

      const announcement: AnnouncementConfig = {
        enabled:
          announcementResult.data?.enabled ??
          DEFAULT_RUNTIME_CONFIG.announcement.enabled,
        text:
          announcementResult.data?.text ??
          DEFAULT_RUNTIME_CONFIG.announcement.text,
        backgroundColor:
          announcementResult.data?.background_color ??
          DEFAULT_RUNTIME_CONFIG.announcement.backgroundColor,
        textColor:
          announcementResult.data?.text_color ??
          DEFAULT_RUNTIME_CONFIG.announcement.textColor,
      };

      const branding = mapSiteBrandingRow(brandingResult.data);

      runtimeConfigInfo("[runtime-config] mapped branding:", {
        orgName: branding.brand?.orgName,
        siteTitle: branding.strings?.siteTitle,
        accentColor1: branding.brand?.colors?.accentColor1,
        defaultQuizId: branding.quiz?.defaultQuizId,
      });

      return { siteConfig, announcement, branding };
    } catch (err) {
      console.error("[runtime-config] unexpected error:", err);
      if (requireDbBranding) {
        throw createError({
          statusCode: 500,
          statusMessage: "[runtime-config] failed to load branding from Supabase",
        });
      }
      return DEFAULT_RUNTIME_CONFIG;
    }
  },
  {
    // 60s TTL: a sane default for content that changes from a dashboard.
    // The webhook at /api/runtime-config/invalidate cuts this short on writes.
    maxAge: 60,
    // Cache key must include org_id so a future multi-tenant gateway gets
    // per-org cache isolation for free. Today there's only one org per
    // deployment so this is a single-entry cache.
    getKey: (event) => `runtime-config:${getCurrentOrgId(event) ?? "anon"}`,
    name: "runtime-config",
  },
);
