import { buildBrandRootStyle } from "~/data/common-helpers";
import { DEFAULT_BRANDING } from "~/data/default-branding";
import { DEFAULT_RUNTIME_CONFIG, type RuntimeConfigDB } from "~/types/runtime-config";

/**
 * Single pre-hydration bootstrap: fetches `/api/runtime-config` (site_config,
 * announcement, site_branding), pins into `useState`, and on SSR injects brand
 * CSS variables + SEO `<head>` before first paint.
 *
 * `useFetch` with a stable key dedupes server → client (no second round-trip).
 */
export default defineNuxtPlugin({
  name: "site-bootstrap",
  enforce: "pre",
  async setup() {
    const state = useState<RuntimeConfigDB>(
      "runtime-config-db",
      () => DEFAULT_RUNTIME_CONFIG,
    );

    const runtimeCfg = useRuntimeConfig();
    const requireDbBranding =
      runtimeCfg.public.requireDbBranding === true ||
      runtimeCfg.public.requireDbBranding === "1" ||
      runtimeCfg.public.requireDbBranding === "true";
    const debugBootstrap =
      import.meta.dev ||
      runtimeCfg.public.debugSiteBootstrap === true ||
      runtimeCfg.public.debugSiteBootstrap === "1" ||
      runtimeCfg.public.debugSiteBootstrap === "true";

    const logBootstrap = (msg: string, detail?: unknown) => {
      if (!debugBootstrap) return;
      if (detail !== undefined) console.info(msg, detail);
      else console.info(msg);
    };

    try {
      const { data, error } = await useFetch<RuntimeConfigDB>(
        "/api/runtime-config",
        {
          key: "runtime-config-db",
          default: () => state.value,
        },
      );

      if (error.value) {
        if (requireDbBranding) {
          throw createError({
            statusCode: 500,
            statusMessage: `[site-bootstrap] /api/runtime-config failed: ${error.value.message}`,
          });
        }
        console.warn(
          "[site-bootstrap] fetch /api/runtime-config failed — using DEFAULT_BRANDING:",
          error.value.message,
        );
      } else if (data.value) {
        state.value = data.value;
      } else {
        if (requireDbBranding) {
          throw createError({
            statusCode: 500,
            statusMessage: "[site-bootstrap] /api/runtime-config returned no data",
          });
        }
        console.warn(
          "[site-bootstrap] fetch returned no data — using DEFAULT_BRANDING",
        );
      }
    } catch (err) {
      if (requireDbBranding) {
        throw err;
      }
      console.warn("[site-bootstrap] unexpected error — using DEFAULT_BRANDING:", err);
    }

    const branding = state.value.branding ?? DEFAULT_BRANDING;
    const defaultOrgName = DEFAULT_BRANDING.brand?.orgName ?? "";
    const resolvedOrgName = branding.brand?.orgName?.trim() ?? "";
    const usingDefaultBranding =
      resolvedOrgName === defaultOrgName &&
      branding.strings?.siteTitle === DEFAULT_BRANDING.strings?.siteTitle;

    if (usingDefaultBranding) {
      if (requireDbBranding) {
        throw createError({
          statusCode: 500,
          statusMessage:
            "[site-bootstrap] DB branding required but fallback branding from common.json was resolved",
        });
      }
      console.warn(
        `[site-bootstrap] FALLBACK branding (data/common.json) — orgName="${resolvedOrgName}". orgId="${runtimeCfg.public.orgId ?? "(not set)"}". Fix /api/runtime-config (Supabase env: NUXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).`,
      );
    } else {
      console.info(
        `[site-bootstrap] OK — branding from Supabase — orgName="${resolvedOrgName}" siteTitle="${branding.strings?.siteTitle ?? ""}" orgId="${runtimeCfg.public.orgId ?? "(not set)"}"`,
      );
    }

    const defaultColors = DEFAULT_BRANDING.brand?.colors ?? {};
    const resolvedColors = branding.brand?.colors ?? {};
    const colorDiff = Object.keys({ ...defaultColors, ...resolvedColors }).filter(
      (k) => defaultColors[k] !== resolvedColors[k],
    );
    if (!usingDefaultBranding && colorDiff.length > 0) {
      console.info(
        `[site-bootstrap] OK — DB brand colors active (${colorDiff.join(", ")}):`,
        Object.fromEntries(colorDiff.map((k) => [k, resolvedColors[k]])),
      );
    } else if (!usingDefaultBranding && colorDiff.length === 0) {
      console.info(
        "[site-bootstrap] branding from Supabase but colors match common.json fallback — update site_branding.colors in DB to customize colors",
      );
    }

    logBootstrap("[site-bootstrap] full branding payload:", branding);
    const orgName = branding.brand?.orgName?.trim() || DEFAULT_BRANDING.brand!.orgName;
    const siteTitle =
      branding.strings?.siteTitle?.trim() ||
      DEFAULT_BRANDING.strings?.siteTitle ||
      "";
    const pageDescription =
      branding.strings?.pageDescription?.trim() ||
      DEFAULT_BRANDING.strings?.pageDescription ||
      "";

    runtimeCfg.public.orgName = orgName;

    const fontStacks = import.meta.server
      ? (await import("~/data/fonts.server")).resolvedFontStacks
      : {};
    const brandCss = buildBrandRootStyle(branding, fontStacks);
    if (brandCss) {
      useHead({
        style: [
          {
            "data-source": import.meta.server
              ? "site_branding (Supabase) + data/fonts.server.ts"
              : "site_branding (Supabase) colors",
            innerHTML: brandCss,
            key: "brand-tokens-root",
          },
        ],
      });
      if (debugBootstrap) {
        console.info("[site-bootstrap] injected :root brand CSS:", brandCss);
      }
    } else {
      console.warn("[site-bootstrap] buildBrandRootStyle returned empty CSS");
    }

    useHead({
      title: siteTitle,
      meta: [
        { name: "description", content: pageDescription },
        { property: "og:type", content: "website" },
        { property: "og:title", content: siteTitle },
        { property: "og:description", content: pageDescription },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: siteTitle },
        { name: "twitter:description", content: pageDescription },
      ],
    });
  },
});
