// https://nuxt.com/docs/api/configuration/nuxt-config

// Load environment variables explicitly
import { config } from "dotenv";
import common from "./data/common.json";
import type { CommonData } from "./data/common-helpers";

config({ path: ".env" });

// Environment-specific configuration
// const isDevelopment = false;
// const isProduction = true;
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Iframe embed allowlist. Parsed once at build/server start so there's no
// per-request cost. `'self'` is always included so same-origin framing works.
// Used to build the `Content-Security-Policy: frame-ancestors` header below
// and also exposed to the client so UI can branch on embed state when useful.
const embedAllowedOrigins = (process.env.NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const frameAncestors = ["'self'", ...embedAllowedOrigins].join(" ");

// Branding + SEO defaults: data/common.json (single source of truth)
const site = common as CommonData;
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
      // script: [
      //   {
      //     innerHTML: "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-PCV5PS6X');",
      //     type: "text/javascript",
      //   },
      //   {
      //     src: "https://www.cg6ttm8trk.com/scripts/main.js",
      //     type: "text/javascript",
      //     defer: true,
      //   },
      // ],
      // noscript: [
      //   {
      //     innerHTML: '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PCV5PS6X" height="0" width="0" style="display:none;visibility:hidden"></iframe>',
      //   },
      // ],
    },
  },

  runtimeConfig: {
    // Server-only environment variables (not exposed to client). Both
    // staging and prod variants are exposed so server endpoints can flip
    // to staging when they detect an embedded request via the
    // `x-embed-mode` header. See server/utils/envMode.ts.
    careValidateApiKeyStaging: process.env.CARE_VALIDATE_API_KEY_STAGING,
    careValidateApiKeyProd: process.env.CARE_VALIDATE_API_KEY_PROD,

    // Server-only feature flags. Sourced from env vars (string "true"/"false").
    enableBNPL: process.env.ENABLE_BNPL === "true",

    public: {
      // Environment detection
      isDevelopment,
      isProduction,

      // Organization branding: data/common.json is source of truth; env optional fallback
      orgName: site.brand?.orgName || process.env.NUXT_ORG_NAME || orgName,

      // Client-side API configuration (safe to expose). Both keys are
      // exposed so `useEnvMode()` can pick the staging one when embedded.
      stripePublishableKeyStaging: process.env.STRIPE_PUBLISHABLE_KEY_STAGING,
      stripePublishableKeyProd: process.env.STRIPE_PUBLISHABLE_KEY_PROD,

      // FingerprintJS Pro API Key (safe to expose to client - public key)
      fingerprintApiKey: process.env.NUXT_PUBLIC_FINGERPRINT_API_KEY || '',

      careValidateApiUrlStaging: process.env.CARE_VALIDATE_API_URL_STAGING,
      careValidateApiUrlProd: process.env.CARE_VALIDATE_API_URL_PROD,

      efBaseUrl: process.env.NUXT_PUBLIC_EF_BASE_URL,
      efApiKey: process.env.NUXT_PUBLIC_EF_API_KEY,

      // Customer.io configuration
      customerioWriteKey: process.env.NUXT_PUBLIC_CUSTOMERIO_WRITE_KEY || '',

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

      bnplActivated: process.env.NUXT_PUBLIC_BNPL_ACTIVATED !== 'false',
      useNewAPI: process.env.USE_NEW_API === 'true',
      homeUrl: process.env.NUXT_PUBLIC_HOME_URL || 'https://hormoneexpertsclinic.com/',

      organizationId: process.env.NUXT_PUBLIC_ORGANIZATION_ID,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,

      // Origins allowed to embed this app in an iframe. Parsed from
      // NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS (comma-separated).
      embedAllowedOrigins,
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
    // { src: "~/plugins/everflow.client.ts", mode: "client" },
    // { src: "~/plugins/everflow-click.client.ts", mode: "client" },
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
