// https://nuxt.com/docs/api/configuration/nuxt-config

// Load environment variables explicitly
import { config } from "dotenv";
import { DEFAULT_BRANDING } from "./data/default-branding";
import { fontPresence } from "./data/fonts.server";
import {
  normalizeGtmContainerId,
  parseEmbedAllowedOrigins,
} from "./utils/envSanitize";

config({ path: ".env" });

// Environment-specific configuration
// const isDevelopment = false;
// const isProduction = true;
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const gtmContainerId = normalizeGtmContainerId(process.env.GTM_CONTAINER_ID);

// Iframe embed allowlist. Parsed once at build/server start so there's no
// per-request cost. `'self'` is always included so same-origin framing works.
// Used to build the `Content-Security-Policy: frame-ancestors` header below
// and also exposed to the client so UI can branch on embed state when useful.
const embedAllowedOrigins = parseEmbedAllowedOrigins(
  process.env.NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS,
);
const frameAncestors = ["'self'", ...embedAllowedOrigins].join(" ");

// Build-time fallbacks for SEO / orgName; SSR `00.site-bootstrap` overrides from Supabase.
const site = DEFAULT_BRANDING;
const orgName = site.brand?.orgName || "The Hormone Experts";
const siteTitle = site.strings?.siteTitle || `${orgName} - Discover a better you with GLP-1s.`;
const siteDescription =
  site.strings?.pageDescription ||
  `${orgName} is made personalized for you and your weight loss journey.`;

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      title: siteTitle,
      meta: [
        {
          name: "description",
          content: siteDescription
        },

        // Open Graph
        {
          property: "og:type",
          content: "website"
        },
        {
          property: "og:title",
          content: siteTitle
        },
        {
          property: "og:description",
          content: siteDescription
        },
        // Twitter Card
        {
          name: "twitter:card",
          content: "summary_large_image"
        },
        {
          name: "twitter:title",
          content: siteTitle
        },
        {
          name: "twitter:description",
          content: siteDescription
        },
      ],
      script: gtmContainerId ? [
        {
          innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmContainerId}');`,
          type: "text/javascript",
        },
      ] : [],
      noscript: gtmContainerId ? [
        {
          innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmContainerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
        },
      ] : [],
    },
  },

  runtimeConfig: {
    // Server-only environment variables (not exposed to client). Both
    // staging and prod variants are exposed so server endpoints can flip
    // to staging when they detect an embedded request via the
    // `x-embed-mode` header. See server/utils/envMode.ts.
    careValidateApiKeyStaging: process.env.CARE_VALIDATE_API_KEY_STAGING,
    careValidateApiKeyProd: process.env.CARE_VALIDATE_API_KEY_PROD,

    // Supabase service-role key for server-side reads of runtime config
    // (site_config + announcement). Bypasses RLS; server is the trusted
    // boundary that enforces the org_id filter. NEVER expose to client.
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Shared secret verified by /api/runtime-config/invalidate. Set the
    // matching value in the Supabase Database Webhook header. See
    // docs/SUPABASE_WEBHOOKS.md.
    supabaseWebhookSecret: process.env.SUPABASE_WEBHOOK_SECRET,

    public: {
      // Environment detection
      isDevelopment,
      isProduction,

      // Organization name: build-time fallback; `00.site-bootstrap` sets from Supabase.
      orgName,

      // Set NUXT_PUBLIC_DEBUG_SITE_BOOTSTRAP=1 to log full branding payload in browser + server.
      debugSiteBootstrap:
        process.env.NUXT_PUBLIC_DEBUG_SITE_BOOTSTRAP === "1" ||
        process.env.NUXT_PUBLIC_DEBUG_SITE_BOOTSTRAP === "true",

      // When true, fail fast instead of falling back to `data/common.json`
      // if Supabase branding cannot be fetched.
      requireDbBranding:
        process.env.NUXT_PUBLIC_REQUIRE_DB_BRANDING === "1" ||
        process.env.NUXT_PUBLIC_REQUIRE_DB_BRANDING === "true",

      // Client-side API configuration (safe to expose). Both keys are
      // exposed so `useEnvMode()` can pick the staging one when embedded.
      stripePublishableKeyStaging: process.env.STRIPE_PUBLISHABLE_KEY_STAGING,
      stripePublishableKeyProd: process.env.STRIPE_PUBLISHABLE_KEY_PROD,

      // NMI Collect.js tokenization (public) keys. Used only when
      // `site_config.use_stripe` is false — the checkout collects card
      // details via NMI Collect.js instead of Stripe Elements. Both variants
      // are exposed so `useEnvMode()` picks the staging key for dev/embedded
      // sessions, mirroring the Stripe publishable keys above.
      nmiTokenizationKeyStaging: process.env.NUXT_NMI_TOKENIZATION_KEY_STAGING,
      nmiTokenizationKeyProd: process.env.NUXT_NMI_TOKENIZATION_KEY_PROD,

      // FingerprintJS Pro API Key (safe to expose to client - public key)
      fingerprintApiKey: process.env.NUXT_PUBLIC_FINGERPRINT_API_KEY || '',

      careValidateApiUrlStaging: process.env.CARE_VALIDATE_API_URL_STAGING,
      careValidateApiUrlProd: process.env.CARE_VALIDATE_API_URL_PROD,

      // Customer.io configuration
      customerioWriteKey: process.env.NUXT_PUBLIC_CUSTOMERIO_WRITE_KEY || '',

      // Google Analytics 4 measurement ID. Opt-in per deployment — when
      // empty the GA4 plugin no-ops and no pageview/event pixels fire. Set
      // this to the client's own GA4 property (e.g. `G-XXXXXXXXXX`) to
      // enable.
      ga4MeasurementId: process.env.NUXT_PUBLIC_GA4_MEASUREMENT_ID || '',

      semaglutide1MonthCode: process.env.SEMAGLUTIDE_1_MONTH_CODE || '',
      semaglutide3MonthCode: process.env.SEMAGLUTIDE_3_MONTH_CODE || '',
      semaglutide6MonthCode: process.env.SEMAGLUTIDE_6_MONTH_CODE || '',
      semaglutide12MonthCode: process.env.SEMAGLUTIDE_12_MONTH_CODE || '',
      tirzepatide1MonthCode: process.env.TIRZEPATIDE_1_MONTH_CODE || '',
      tirzepatide3MonthCode: process.env.TIRZEPATIDE_3_MONTH_CODE || '',
      tirzepatide6MonthCode: process.env.TIRZEPATIDE_6_MONTH_CODE || '',
      tirzepatide12MonthCode: process.env.TIRZEPATIDE_12_MONTH_CODE || '',
      specialSms10Code: process.env.SPECIAL_SMS_10_CODE || '',
      specialSms20Code: process.env.SPECIAL_SMS_20_CODE || '',

      // When false, the consultation→checkout transition skips the
      // `/api/create-abandoned-lead` call entirely. Hardcoded for this
      // project; flip to true (or wire to an env var) on clients that
      // actually want a Lead case created in CareValidate when a user
      // finishes the quiz but hasn't paid yet.
      trackAbandonedLead: false,

      // Supabase URL is public (anon key auth happens client-side for
      // tables we eventually want clients to query directly; today it's
      // only consumed by the server util).
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,

      // The UUID of THIS deployment's org row. Every runtime-config /
      // products / quiz read is scoped by it. Must match the org_id of
      // the rows in Supabase or the app falls back to DEFAULT_RUNTIME_CONFIG.
      orgId: process.env.NUXT_PUBLIC_ORG_ID,

      // Origins allowed to embed this app in an iframe. Parsed from
      // NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS (comma-separated).
      embedAllowedOrigins,

      // Build-time font detection result. Lets the dev `brand-snapshot` page
      // (and any future debug UI) report which font files exist without
      // pulling `node:fs` into the client bundle.
      fontPresence,

      // Removed runtime-flag slots (moved to Supabase `site_config`):
      //   bnplActivated, useNewAPI, homeUrl, efBaseUrl, efApiKey
      // Read them via `useRuntimeConfigDB()` instead of `useRuntimeConfig().public`.
    },
  },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/eslint-config", "nuxt-marquee", "@nuxt/image"],
  image: {
    // Use 'none' provider for static production builds (pass-through, no transformation)
    // IPX requires a server and doesn't work in static exports
    provider: isProduction ? 'none' : 'ipx',
    // Quality settings for optimization (only applies when provider supports it)
    quality: 80,
    // Responsive breakpoints
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },
  plugins: [
    { src: "~/plugins/preserve-tracking-params.client.ts", mode: "client" },
    { src: "~/plugins/checkout-redirect.client.ts", mode: "client" },
    { src: "~/plugins/toast.client.ts", mode: "client" },
    { src: "~/plugins/motion.client.ts", mode: "client" },
    { src: "~/plugins/embed-api-headers.client.ts", mode: "client" },
    // { src: "~/plugins/google-analytics.client.ts", mode: "client" },
    // { src: "~/plugins/customerio.client.ts", mode: "client" },
    { src: "~/plugins/everflow.client.ts", mode: "client" },
    { src: "~/plugins/everflow-click.client.ts", mode: "client" },
  ],
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  build: {
    transpile: ['@img-comparison-slider/vue']
  },
  nitro: {
    // Vercel sets VERCEL=1 during build; Nitro's vercel preset emits the output Vercel expects.
    ...(process.env.VERCEL ? { preset: "vercel" as const } : {}),
    // Set cache headers for static assets
    routeRules: {
      '/_nuxt/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      '/assets/fonts/**': {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      // Allow framing from configured origins. Applied broadly so every
      // HTML route (quiz, checkout, welcome, terms, etc.) is embeddable.
      // The two rules above take precedence for their paths due to rule
      // specificity; this one catches everything else.
      '/**': {
        headers: {
          'Content-Security-Policy': `frame-ancestors ${frameAncestors};`
        }
      },
    }
  }
});
