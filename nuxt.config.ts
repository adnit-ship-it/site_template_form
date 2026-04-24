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
    // Server-only environment variables (not exposed to client)
    careValidateApiKey: isDevelopment
      ? process.env.CARE_VALIDATE_API_KEY_STAGING
      : process.env.CARE_VALIDATE_API_KEY_PROD,

    public: {
      // Environment detection
      isDevelopment,
      isProduction,

      // Organization branding: data/common.json is source of truth; env optional fallback
      orgName: site.brand?.orgName || process.env.NUXT_ORG_NAME || orgName,

      // Client-side API configuration (safe to expose)
      stripePublishableKey: isDevelopment
        ? process.env.STRIPE_PUBLISHABLE_KEY_STAGING
        : process.env.STRIPE_PUBLISHABLE_KEY_PROD,

      // FingerprintJS Pro API Key (safe to expose to client - public key)
      fingerprintApiKey: process.env.NUXT_PUBLIC_FINGERPRINT_API_KEY || '',

      // Environment-specific API endpoints
      careValidateApiUrl: isDevelopment
        ? process.env.CARE_VALIDATE_API_URL_STAGING
        : process.env.CARE_VALIDATE_API_URL_PROD,

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
      homeUrl: process.env.NUXT_PUBLIC_HOME_URL || 'https://hormoneexpertsclinic.com/',

      organizationId: process.env.NUXT_PUBLIC_ORGANIZATION_ID,
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
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
    }
  }
});
