# Where The Template Gets Its Data

A reference guide for every piece of configuration and content this template uses. Each section explains where the value lives, who can change it, and what part of the app consumes it.

---

## Table of contents

1. The four layers
2. Quick lookup: every config item
3. Layer 1 — Environment variables (`.env`)
4. Layer 2 — Build-time JSON (`data/common.json`)
5. Layer 3 — Static assets (`assets/fonts/`, `public/`)
6. Layer 4 — Supabase (runtime config + future data)
7. Code-defined data (products, quizzes)
8. URL query parameters and localStorage
9. Feature walkthroughs: how the pieces combine
10. Dashboard write paths: GitHub vs Supabase
11. "How do I change X?" playbooks

---

## 1. The four layers

Every value the app uses lives in one of these four places. The choice of layer is intentional — see [CONFIG_SPLIT.md](./CONFIG_SPLIT.md) for the rationale.

| Layer | Where it lives | When it loads | Edited by |
|---|---|---|---|
| Environment variables | `.env` (local) / Vercel env (deployed) | Build time + server start | Developer or CI/CD secret manager |
| Build-time JSON | `data/common.json`, code in `data/formSteps.ts` / `data/quizConfigs.ts` etc. | Build time, baked into JS bundle and HTML | Developer via PR (or dashboard via GitHub commit, future) |
| Static assets | `assets/fonts/*.woff2`, `public/*` | Build time, served from CDN | Developer via PR (or dashboard via GitHub commit) |
| Supabase (runtime) | `site_config` and `announcement` tables (and more in future phases) | On each request, cached for 60s | Dashboard via Supabase DB writes |

---

## 2. Quick lookup: every config item

Skim this table to find where any given thing lives. Detail in later sections.

| Item | Layer | Specific location | Reader in app | Notes |
|---|---|---|---|---|
| Organization name | Build-time JSON | `data/common.json` → `brand.orgName` | SEO `<title>`, OG tags, policy pages, SMS consent text, marketing copy | Used in initial HTML — must be in repo for SEO |
| Site title (HTML `<title>`) | Build-time JSON | `data/common.json` → `strings.siteTitle` | `nuxt.config.ts` → `app.head.title` | SEO |
| Page description (meta) | Build-time JSON | `data/common.json` → `strings.pageDescription` | `nuxt.config.ts` → meta description, OG, Twitter | SEO |
| Brand colors | Build-time JSON | `data/common.json` → `brand.colors` | Tailwind theme + `:root` CSS variables via `00.brand-tokens.server.ts` plugin | Tailwind compiles these at build |
| Body font + heading font | Build-time JSON + assets | `data/common.json` → `brand.fonts`, files at `assets/fonts/bodyFont.woff2` + `headingFont.woff2` | `assets/css/main.css` `@font-face`, `tailwind.config.ts` font stacks | Detected by `data/fonts.server.ts` at build |
| Favicon | Static asset | `public/favicon.ico` (Nuxt convention) | HTML `<head>` automatically | |
| Logo | Static asset | `assets/images/brand/logo.png` | Layout components | |
| Default quiz (when no params) | Build-time JSON + Supabase override | `data/common.json` → `quiz.defaultQuizId` (build-time fallback); `site_config.default_quiz_id_override` (runtime override) | `getDefaultQuizId()` function exported from `data/quizConfigs.ts` — checks Supabase override first, falls back to common.json | Dashboard can flip the default at runtime via `site_config.default_quiz_id_override` without a redeploy |
| Announcement bar (text, colors, enabled) | Supabase | `announcement` table | `components/layout/AnnouncementBar.vue` (rendered from inside `Navbar.vue`) via `useRuntimeConfigDB()` | Reactive; dashboard edits propagate within 60 seconds (or instantly with the webhook). Link target is hardcoded to `/consultation` in the component and auto-suppressed when the user is already on `/consultation` or `/checkout` |
| BNPL enabled flag | Supabase | `site_config.bnpl_activated` | `components/checkout/PaymentStep.vue` | Composed with `useIsEmbedded()` — BNPL auto-disables in iframes |
| Home URL ("Go home" button) | Supabase | `site_config.home_url` | `pages/confirmation.vue` | |
| Use new API flag | Supabase | `site_config.use_new_api` | `utils/submitPatientForm.ts`, `server/api/submit-form.post.ts`, `components/checkout/PaymentStep.vue` | Decides `/cases` (new) vs `/dynamic-case` (old) endpoint and which payload builder runs |
| Everflow base URL / offer id / named event ids | Supabase | `site_config.everflow_base_url`, `everflow_offer_id`, `everflow_event_ids` (jsonb array of `{name, id}`) | `composables/useEverflow.ts` (currently dormant; Everflow plugins commented out) | API key was removed — not needed for the integration shape this app uses |
| Track abandoned lead | Hardcoded | `nuxt.config.ts` → `public.trackAbandonedLead: false` | `composables/usePatientForm.ts` | Per-client toggle, flip and rebuild |
| GTM container id | Environment | `GTM_CONTAINER_ID` in `.env` | `nuxt.config.ts` `app.head.script` and `noscript` | Must be in HTML head before hydration |
| Stripe publishable keys (staging + prod) | Environment | `STRIPE_PUBLISHABLE_KEY_STAGING` / `_PROD` | `composables/useStripe.ts` via `composables/useEnvMode.ts` | Staging used when app is iframe-embedded |
| Stripe secret keys (server) | Vercel env only | Not in this repo | Server endpoints | |
| CareValidate API keys (staging + prod) | Environment | `CARE_VALIDATE_API_KEY_STAGING` / `_PROD` | `server/utils/envMode.ts` | Server-only secrets |
| CareValidate API URLs (staging + prod) | Environment | `CARE_VALIDATE_API_URL_STAGING` / `_PROD` | `server/utils/envMode.ts` | |
| CSP allowed iframe origins | Environment | `NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS` (comma-separated) | `nuxt.config.ts` → Nitro `routeRules` → `Content-Security-Policy: frame-ancestors` header | Set per response by the server |
| Customer.io write key | Environment | `NUXT_PUBLIC_CUSTOMERIO_WRITE_KEY` | Customer.io composables / plugin (some plugins are commented out) | |
| FingerprintJS Pro API key | Environment | `NUXT_PUBLIC_FINGERPRINT_API_KEY` | Currently dormant in `useFingerprint` | |
| Promo / SMS codes | Environment | `SEMAGLUTIDE_*_CODE`, `TIRZEPATIDE_*_CODE`, `SPECIAL_SMS_*_CODE` | `composables/useCheckout.ts` and discount logic | Per-product or per-campaign discount codes |
| Org id for Supabase scoping | Environment | `NUXT_PUBLIC_ORG_ID` (slug, matches CareGLP `linkName` — e.g. `apexmd`) | `server/utils/orgId.ts` → every Supabase query | Must match the `org_id` column of the rows the dashboard provisioned |
| Supabase URL | Environment | `NUXT_PUBLIC_SUPABASE_URL` | `server/utils/supabase.ts` | |
| Supabase anon key | Environment | `SUPABASE_ANON_KEY` | Not currently used by the reader (service-role only) but reserved for future client-direct queries | |
| Supabase service-role key | Environment | `SUPABASE_SERVICE_ROLE_KEY` (server only) | `server/utils/supabase.ts` — bypasses RLS, server is the trusted org-filter boundary | Must never reach the client |
| Supabase webhook secret | Environment | `SUPABASE_WEBHOOK_SECRET` (server only) | `server/api/runtime-config/invalidate.post.ts` | Verifies the Supabase Database Webhook |
| Product catalog (categories, products, variations, pricing, availability, quiz mapping) | Supabase | `categories` + `products` tables (per-org). Variations live as JSONB on each product row (eventual `product_variations` table is a Phase 3 normalization). Fetched by [`server/api/products.get.ts`](../server/api/products.get.ts), pinned to `useState('products-catalog')` by [`plugins/02.products-catalog.ts`](../plugins/02.products-catalog.ts), exposed via [`composables/useProductsCatalog.ts`](../composables/useProductsCatalog.ts). | [`composables/useProductsCatalog.ts`](../composables/useProductsCatalog.ts) (used by `pages/checkout.vue`, `components/checkout/ProductSelection.vue`, `composables/useCheckout.ts`, `composables/usePatientForm.ts`) | Per-product `quizId` lookup goes through [`server/api/products/[productId].get.ts`](../server/api/products/[productId].get.ts), called by `pages/consultation.vue` before `usePatientForm()` runs. Legacy `data/intake-form/productsList.json` was deleted in this migration; the seed for `adele-frizzell-llc` lives at [`docs/seeds/products-adele-frizzell-llc.sql`](./seeds/products-adele-frizzell-llc.sql) |
| Quiz definitions (questions, options, conditional logic, validators, disqualification rules) | Code | `data/formSteps.ts` + `data/quizConfigs.ts` | `composables/usePatientForm.ts` loads via `getQuizById(id)` | Phase 3: text + structure overridable via Supabase; logic stays in code as the canonical "template" |
| Disqualification config per quiz | Code | `composables/usePatientForm.ts` → `DISQUALIFICATION_CONFIG` object | Same composable | |
| Legal text (Terms, Privacy, Medical Consent, Privacy Practices) | Code (Vue templates) | `pages/terms.vue`, `pages/privacy.vue`, `pages/medical-consent.vue`, `pages/privacy-practices.vue` | Rendered directly | `{{ orgName }}` interpolated from `runtimeConfig.public.orgName` (which derives from `common.json`) |

---

## 3. Layer 1 — Environment variables

Defined in `.env` for local development; set in the Vercel project for deployed environments. Read at server start (server-only vars) or build time (public vars baked into the bundle).

### Server-only (kept secret)

| Variable | Purpose | Read by |
|---|---|---|
| `CARE_VALIDATE_API_KEY_STAGING` | CareValidate API auth for staging environment | `server/utils/envMode.ts` |
| `CARE_VALIDATE_API_KEY_PROD` | CareValidate API auth for production | `server/utils/envMode.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase admin key (bypasses RLS) | `server/utils/supabase.ts` |
| `SUPABASE_WEBHOOK_SECRET` | Shared secret with the Supabase Database Webhook | `server/api/runtime-config/invalidate.post.ts` |
| `GTM_CONTAINER_ID` | Google Tag Manager container id (e.g. `GTM-XXXXXXX`). Leave empty to disable GTM | `nuxt.config.ts` injects the GTM script into `<head>` at build |

### Public (safe to expose to browser)

These are prefixed `NUXT_PUBLIC_` and end up in `runtimeConfig.public`, accessible client-side.

| Variable | Purpose | Read by |
|---|---|---|
| `STRIPE_PUBLISHABLE_KEY_STAGING` | Stripe client key for staging | `composables/useEnvMode.ts` |
| `STRIPE_PUBLISHABLE_KEY_PROD` | Stripe client key for production | `composables/useEnvMode.ts` |
| `CARE_VALIDATE_API_URL_STAGING` | CareValidate base URL for staging | `server/utils/envMode.ts` |
| `CARE_VALIDATE_API_URL_PROD` | CareValidate base URL for production | `server/utils/envMode.ts` |
| `NUXT_PUBLIC_FINGERPRINT_API_KEY` | FingerprintJS Pro public key (currently dormant) | `composables/useFingerprint.ts` |
| `NUXT_PUBLIC_CUSTOMERIO_WRITE_KEY` | Customer.io CDP write key (the related plugin is commented out today) | Customer.io plugin/composable |
| `NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS` | Comma-separated origins allowed to iframe-embed this app | `nuxt.config.ts` builds the CSP `frame-ancestors` header from this |
| `NUXT_PUBLIC_SUPABASE_URL` | Base URL of the Supabase project | `server/utils/supabase.ts` |
| `SUPABASE_ANON_KEY` | Anon key (reserved for future client-direct reads) | Not currently consumed |
| `NUXT_PUBLIC_ORG_ID` | Slug identifying which Supabase org rows this deployment reads (matches the org's `linkName` from CareGLP, e.g. `apexmd`) | `server/utils/orgId.ts` |
| `SEMAGLUTIDE_1_MONTH_CODE` through `SEMAGLUTIDE_12_MONTH_CODE` | Discount/promo codes for semaglutide variations | Discount logic |
| `TIRZEPATIDE_1_MONTH_CODE` through `TIRZEPATIDE_12_MONTH_CODE` | Same for tirzepatide | Discount logic |
| `SPECIAL_SMS_10_CODE`, `SPECIAL_SMS_20_CODE` | SMS-marketing promo codes | Discount logic |

### Removed (moved to Supabase as part of Phase 1)

The following are no longer environment variables — they live in `site_config` (Supabase) and are read via `useRuntimeConfigDB()`:

- `NUXT_PUBLIC_BNPL_ACTIVATED` → `site_config.bnpl_activated`
- `USE_NEW_API` → `site_config.use_new_api`
- `NUXT_PUBLIC_HOME_URL` → `site_config.home_url`
- `NUXT_PUBLIC_EF_BASE_URL` / `NUXT_PUBLIC_EF_API_KEY` → `site_config.everflow_base_url` (the API key was dropped — the Everflow integration uses `offer_id` + named `event_ids` instead)

See [CONFIG_SPLIT.md](./CONFIG_SPLIT.md) for the rationale.

---

## 4. Layer 2 — Build-time JSON (`data/common.json`)

The single source of truth for brand identity and SEO. Baked into the bundle at build time. Editing it requires a redeploy.

### Current shape

```
{
  "brand": {
    "orgName": "Some Client",
    "colors": {
      "backgroundColor": "#F6F6F6",
      "bodyColor": "#000000",
      "accentColor1": "#112641",
      "accentColor2": "#112641",
      "backgroundColor2": "#F6F6F6"
    },
    "fonts": {
      "bodyFile": "bodyFont.woff2",
      "headingFile": "headingFont.woff2"
    }
  },
  "strings": {
    "siteTitle": "Some Client - Discover a better you with GLP-1s.",
    "pageDescription": "Some Client is made personalized for you and your weight loss journey."
  },
  "quiz": {
    "defaultQuizId": "hair-loss"
  }
}
```

### Field-by-field

| Field | Used for |
|---|---|
| `brand.orgName` | HTML `<title>`, OG and Twitter card titles, page meta description, policy page interpolation (every `{{ orgName }}` in `pages/terms.vue` etc.), SMS consent text, marketing copy throughout `data/formSteps.ts` |
| `brand.colors.*` | Tailwind theme via `tailwind.config.ts` (compiled into utility classes like `bg-accentColor1` at build) and `:root` CSS variables via `plugins/00.brand-tokens.server.ts` (so the same names work in raw CSS too) |
| `brand.fonts.bodyFile` / `headingFile` | Documentation only — actual font usage is driven by `assets/css/main.css` `@font-face` blocks and `data/fonts.server.ts` detection. Keep in sync if you swap files |
| `strings.siteTitle` | `<title>`, OG/Twitter title meta tags |
| `strings.pageDescription` | `<meta name="description">`, OG/Twitter description |
| `quiz.defaultQuizId` | Build-time default quiz that loads on `/consultation` when no `categoryId` or `productId` URL param. Also used as the `categoryId` carried over to `/checkout` after finishing. Consumed via `getDefaultQuizId()` from `data/quizConfigs.ts` (which prefers `site_config.default_quiz_id_override` from Supabase when set). The raw build-time value is `REPO_DEFAULT_QUIZ_ID` |

### Schema enforcement

The `CommonData` TypeScript interface in `data/common-helpers.ts` mirrors this shape. Tests in `test/unit/common-json.spec.ts` assert on required fields.

---

## 5. Layer 3 — Static assets

### Fonts

| File | Role |
|---|---|
| `assets/fonts/bodyFont.woff2` | Required. Loaded as `BodyFont` family. Drives `<p>`, `<button>`, `<body>`, and `<h1>` through `<h3>` when no heading font is present |
| `assets/fonts/headingFont.woff2` | Optional. Loaded as `HeadingFont` family when present. Drives `<h1>` through `<h3>` |

Detected at build time by `data/fonts.server.ts`. If `headingFont.woff2` is missing, the heading CSS stack falls back to body font (no broken `@font-face` requests).

### Other static assets

| Path | Role |
|---|---|
| `public/favicon.ico` (Nuxt convention) | Favicon |
| `assets/images/brand/logo.png` | Site logo, rendered in navbar layouts |
| `assets/images/products/*` | Product images referenced by the `images.mainImg` JSONB column on `categories` / `products` rows in Supabase |
| `assets/images/quiz/*` | Marketing visuals used inside quizzes |
| `assets/images/icons/*` | Icons (Trustpilot, payment provider badges, etc.) |

To swap any of these, commit a new file at the same path. The new file ships on the next deploy.

---

## 6. Layer 4 — Supabase (runtime config)

Provisioned per the [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) contract. All Supabase reads in this app go through `useRuntimeConfigDB()` (client) or `$fetch('/api/runtime-config')` (server), which is cached for 60 seconds and refreshable via webhook.

### `site_config` table (one row per org)

| Column | Type | Role |
|---|---|---|
| `org_id` | text PK (slug) | Filter — must match `NUXT_PUBLIC_ORG_ID`. Lowercase slug from the org's CareGLP `linkName` (e.g. `apexmd`) |
| `bnpl_activated` | bool | Show/hide BNPL payment option in checkout |
| `home_url` | text | "Go home" CTA on confirmation page |
| `use_new_api` | bool | True = `/cases` endpoint and new payload builder; false = `/dynamic-case` and old builder |
| `everflow_base_url` | text | Base URL for the Everflow integration (currently dormant) |
| `everflow_offer_id` | text | Everflow offer id |
| `everflow_event_ids` | jsonb (array) | Named events as `[{ name: "Begin Quiz", id: 111 }, ...]`. Lets you map multiple Everflow events from one row |
| `default_quiz_id_override` | text (nullable) | If set, overrides `data/common.json` → `quiz.defaultQuizId` at runtime |
| `updated_at` | timestamptz | Auto-updated by DB trigger |

### `announcement` table (one row per org)

| Column | Type | Role |
|---|---|---|
| `org_id` | text PK (slug) | Filter — matches the org's CareGLP `linkName` |
| `enabled` | bool | When false, the announcement bar is not rendered and the layout space is reclaimed |
| `text` | text | Announcement message text |
| `background_color` | text | Bar background (hex or any CSS color) |
| `text_color` | text | Bar text color |
| `updated_at` | timestamptz | Auto-updated |

**No `link` column.** The link target is always `/consultation`, hardcoded in [`components/layout/AnnouncementBar.vue`](../components/layout/AnnouncementBar.vue). The component renders the bar as a plain `<span>` (no link) when the user is already on `/consultation` or `/checkout`, so the click doesn't take them to the page they're already on.

### Fallback behavior

If Supabase isn't reachable, the env vars aren't set, or the org row is missing, the app falls back to `DEFAULT_RUNTIME_CONFIG` defined in `types/runtime-config.ts`. The defaults intentionally mirror pre-Phase-1 behavior so a deployment without Supabase still works correctly.

---

## 7. Code-defined data (today)

These will move to Supabase in later phases, but today they live in TypeScript / JSON files in the repo.

### Product catalog (Supabase: `categories` + `products`)

The product catalog lives in Supabase — see [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md#categories) for the full schema. Each row keys on `(org_id, id)`. Variations live as a JSONB array on each product row (a future `product_variations` table is a Phase 3 normalization).

Reader pipeline:

- [`server/api/products.get.ts`](../server/api/products.get.ts) returns the full nested catalog (categories with `.products[]`) for the current `org_id`. Cached 60s.
- [`plugins/02.products-catalog.ts`](../plugins/02.products-catalog.ts) fetches it once per page load and pins the result into `useState('products-catalog')`.
- [`composables/useProductsCatalog.ts`](../composables/useProductsCatalog.ts) returns reactive `categories` / `products` refs sourced from that state slot.

For quiz selection from `?productId=<slug>`, [`server/api/products/[productId].get.ts`](../server/api/products/[productId].get.ts) does a targeted `select quiz_id` against the `products` table — `pages/consultation.vue` awaits that before initializing `usePatientForm()`.

Variations have two distinct identifiers in each JSONB array entry:

| Field | Used for |
|---|---|
| `variation.id` | URL parameter `productId=<uuid>`, new-API payload (`buildFormPayloadNew`), tracking |
| `variation.bundleId` | Sent as `productBundleId` in the legacy API payload (`buildFormPayload`) |

Both endpoints are DB-only — there is no local-JSON fallback. The legacy `data/intake-form/productsList.json` and `data/products.ts` were deleted in this migration. The seed for `adele-frizzell-llc` lives at [`docs/seeds/products-adele-frizzell-llc.sql`](./seeds/products-adele-frizzell-llc.sql).

### Quizzes (`data/formSteps.ts` + `data/quizConfigs.ts`)

The quiz definitions are pure TypeScript because they include functions (`renderCondition`, `disqualifyCondition`, validators, `displayValue` calculations) that can't be expressed in plain JSON.

- `data/formSteps.ts` defines the step arrays (one per quiz family, e.g. `glp1Steps`, `hairSteps`, `skinSteps`)
- `data/quizConfigs.ts` registers each quiz id (e.g. `weight-loss`, `hair-loss`, `skin-care`) with its progress steps and combined steps array
- `getQuizById(id)` returns a fully resolved `QuizConfig`
- `getDefaultQuizId()` returns the id used when no `categoryId` or `productId` is in the URL (Supabase override wins, common.json otherwise)

Phase 3 of the [config split](./CONFIG_SPLIT.md) will overlay Supabase-stored text and structure on top of these code templates so the dashboard can edit quizzes without code changes — but logic always stays in code.

---

## 8. URL query parameters and localStorage

Not configuration, but they drive a lot of runtime behavior. Worth knowing.

### URL query parameters

| Parameter | Purpose | Read by |
|---|---|---|
| `?productId=<slug>` or `?productId=<variation-uuid>` | Specifies which product / variation the user is shopping. Resolves to a quiz via `product.quizId` | `composables/usePatientForm.ts`, `components/form/StepLayout.vue`, `pages/checkout.vue` |
| `?categoryId=<quiz-id>` | Specifies which quiz to load directly (used when no specific product is in scope) | Same |
| `?productBundleId=<uuid>` | Optional. Pre-resolves the variation id. Used by BNPL bounce-back URLs | `composables/usePatientForm.ts` |
| `?utm_source`, `?utm_medium`, `?utm_campaign`, `?utm_term`, `?utm_content` | Marketing attribution. Preserved across navigation by `plugins/preserve-tracking-params.client.ts` | All checkout / consultation flows |
| `?promo=<code>` | Pre-fills a promo code | `components/checkout/PaymentStep.vue` |
| `?affid`, `?oid`, `?uid`, `?sub1` through `?sub5`, `?source_id`, `?_ef_transaction_id` | Everflow affiliate parameters | Preserved across navigation |
| `?case_id=<id>` | Set on confirmation redirect after successful submission | `pages/confirmation.vue` |
| `?meta_event_id=<id>` | For Meta Pixel deduplication after server-side CAPI event | `pages/confirmation.vue` |
| `?showSync=true` | Forces a sync-video flag on the confirmation page | `pages/confirmation.vue` |
| `?payment_intent=<id>` | Set by Stripe on BNPL return | `plugins/checkout-redirect.client.ts` |

### localStorage keys

| Key | Purpose |
|---|---|
| `quiz_<quizId>_data` | Persists the user's in-progress quiz answers per quiz |
| `quiz_<quizId>_completed` | Boolean flag — when true, `/consultation` auto-redirects to `/checkout` |
| `bnpl_product_data` | Captures product info before BNPL redirect so it survives the round-trip |
| `bnpl_checkout_data` | Snapshot of full checkout state before BNPL redirect |
| `checkout_step1_data` | Form answers snapshot used by the confirmation page if the quiz data was already cleared |
| `universal_id_upload` | Pre-uploaded ID document data |
| `abandoned_lead_case_id` | The CareValidate Lead case id from `createAbandonedLead` (when that feature is enabled) |
| `tp_customer_data` | Customer name/email/reference for the Trustpilot review widget |
| `revoffers_convert_data` | RevOffers / Katalys conversion payload for the confirmation page |
| `meta_event_id_purchase` | Meta Pixel deduplication id for the purchase event |
| `hideMonthly` | UI preference to hide the monthly plan option |
| `glp1_extra_questions` | Optional extra GLP-1 questions appended to the form payload |

---

## 9. Feature walkthroughs

How a real feature pulls data from multiple layers at once.

### A: Loading the quiz on `/consultation`

1. Browser hits `/consultation?productId=skin-care-test`
2. `pages/consultation.vue` (top-level `await` in `<script setup>`) calls `/api/products/skin-care-test`
3. The endpoint queries Supabase: `select quiz_id from products where org_id = ? and id = ?`
4. The resolved `quizId` (e.g. `"skin-care"`) is stashed in `useState('resolvedProductQuizId')`
5. `composables/usePatientForm.ts` then runs; its `selectedQuizId` computed reads that state slot when `?productId` is set, falls back to `?categoryId` (used directly as a quiz id), and finally to `getDefaultQuizId()` (Supabase `site_config.default_quiz_id_override` or `data/common.json:quiz.defaultQuizId`)
6. `getQuizById("skin-care")` returns the fully resolved `QuizConfig` from `data/quizConfigs.ts`
7. Quiz renders with `brand.orgName` and `brand.colors` (from `common.json`) baked into the markup and styling
8. Announcement bar (if `announcement.enabled` is true in Supabase) renders above the quiz; otherwise the `--site-announcement-height` CSS variable resolves to `0px` and the layout collapses cleanly

### B: Rendering the checkout page

1. User finishes quiz, navigates to `/checkout?productId=skin-care-test`
2. `pages/checkout.vue` reads the catalog from `useProductsCatalog()` (already fetched at app start by `plugins/02.products-catalog.ts`) and finds the matching product/category to display variations
3. `PaymentStep.vue` reads `useNewAPI` and `bnplActivated` from `useRuntimeConfigDB()` (which the Nuxt plugin already fetched from Supabase on app init)
4. BNPL option shows only if `site_config.bnpl_activated` is true AND the app isn't in an iframe
5. Stripe is initialized using `STRIPE_PUBLISHABLE_KEY_PROD` or `_STAGING` based on `useEnvMode()` detecting iframe embedding
6. Discount codes for the user's variation come from the `SEMAGLUTIDE_*_CODE` env vars

### C: Submitting the form

1. User clicks Submit
2. `utils/submitPatientForm.ts` reads `useNewAPI` from `useRuntimeConfigDB()`
3. Calls either `buildFormPayloadNew` (variation id as `productBundleId`) or `buildFormPayload` (variation's `bundleId` as `productBundleId`) — see `types/checkout.ts` `ProductVariation` for the field distinction
4. Sends to `/api/submit-form` on the Nuxt server
5. Server route re-reads `useNewAPI` from the same cached `/api/runtime-config` endpoint, picks `/cases` or `/dynamic-case`, and forwards to CareValidate using the appropriate API key from env

### D: Confirmation page

1. Server redirects to `/confirmation?case_id=<id>&productBundleId=<id>&meta_event_id=<uuid>`
2. `pages/confirmation.vue` reads the case id from the URL
3. Reads `site_config.home_url` from `useRuntimeConfigDB()` for the "Go home" CTA
4. Reads tracking data from localStorage (`tp_customer_data`, `revoffers_convert_data`, `meta_event_id_purchase`) and fires tracking pixels

### E: Legal pages

1. `/terms` → `pages/terms.vue`
2. The Vue template interpolates `{{ orgName }}` ~30 times throughout
3. `orgName` resolves to `runtimeConfig.public.orgName`, which `nuxt.config.ts` derives from `data/common.json` → `brand.orgName` at build time

---

## 10. Dashboard write paths

The dashboard (separate app, not in this repo) has two ways to change template behavior. Different items use different channels:

| Channel | What it does | Best for | Latency |
|---|---|---|---|
| GitHub commit (via GitHub API / app) | Writes a file directly into this repo, triggers a Vercel deploy | Binary assets, code changes, legal text edits, brand color tweaks, schema additions | Minutes (Vercel build + deploy) |
| Supabase write | UPDATE on `site_config` or `announcement` row | Runtime flags, content toggles, copy edits to announcement bar, future product/quiz overrides | Seconds (or instant with the webhook configured) |

| Item | Write channel |
|---|---|
| Company name | GitHub (edit `data/common.json`) |
| Site title / description | GitHub (edit `data/common.json`) |
| Brand colors | GitHub (edit `data/common.json`) |
| Favicon | GitHub (replace file in `public/`) |
| Logo | GitHub (replace file in `assets/images/brand/`) |
| Body / heading fonts | GitHub (replace `assets/fonts/bodyFont.woff2` or `headingFont.woff2`) |
| Announcement bar enabled / text / colors | Supabase (UPDATE `announcement`) |
| BNPL on/off | Supabase (UPDATE `site_config.bnpl_activated`) |
| Home URL | Supabase (UPDATE `site_config.home_url`) |
| Use new vs old API | Supabase (UPDATE `site_config.use_new_api`) |
| Everflow ids | Supabase (UPDATE `site_config.everflow_*`) |
| Default quiz id (default runtime) | Supabase override at `site_config.default_quiz_id_override`, with permanent change in `data/common.json:quiz.defaultQuizId` via GitHub |
| Product active / inactive | Supabase (UPDATE `products.availability` to `'in_stock'` / `'out_of_stock'`) |
| Product price | Supabase (UPDATE the JSONB `products.variations` array — bump the `price` field on the relevant entry) |
| Quiz question text | GitHub (edit `data/formSteps.ts`) — moves to Supabase Phase 3 |

---

## 11. "How do I change X?" playbooks

### Change the brand name
1. Edit `data/common.json` → `brand.orgName`
2. Commit + deploy
3. Every page (HTML `<title>`, OG tags, policy pages, marketing copy, SMS consent) updates

### Change a brand color
1. Edit `data/common.json` → `brand.colors.<name>`
2. Commit + deploy
3. Tailwind regenerates utility classes (`bg-accentColor1`, `text-bodyColor`, etc.) and `:root` CSS variables update site-wide

### Swap the body font
1. Convert the new font to `.woff2`
2. Replace `assets/fonts/bodyFont.woff2`
3. Commit + deploy

### Add a heading font (when there wasn't one)
1. Drop `headingFont.woff2` into `assets/fonts/`
2. Commit + deploy. Build-time detection at `data/fonts.server.ts` automatically wires it to all `<h1>`, `<h2>`, `<h3>`

### Turn the announcement bar on (or change its content)
1. UPDATE the row in Supabase `announcement` for your `org_id`
2. With the webhook wired (see [SUPABASE_WEBHOOKS.md](./SUPABASE_WEBHOOKS.md)) the change is instant; otherwise it takes up to 60 seconds

### Disable BNPL
1. UPDATE `site_config.bnpl_activated` = `false` for your `org_id`
2. Same propagation as above

### Switch which API endpoint and payload format submissions use
1. UPDATE `site_config.use_new_api` for your `org_id` (true = new `/cases`, false = legacy `/dynamic-case`)
2. Same propagation

### Change the "Go home" CTA target on the confirmation page
1. UPDATE `site_config.home_url` for your `org_id`
2. Same propagation

### Change the default quiz that loads on `/consultation`
- Permanent change: edit `data/common.json` → `quiz.defaultQuizId`, commit, deploy
- Temporary / per-deployment override: UPDATE `site_config.default_quiz_id_override` for your `org_id`

### Mark a product out of stock
- UPDATE `products.availability = 'out_of_stock'` in Supabase for the relevant `(org_id, id)` pair. Cache TTL is 60s; clear instantly via the runtime-config webhook (see [SUPABASE_WEBHOOKS.md](./SUPABASE_WEBHOOKS.md)) once it's wired for the products endpoint, or wait the TTL.

### Add a new product
- INSERT a new row into `products` in Supabase (and `categories` first if the category doesn't exist yet). See [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md#products) for the column list and example INSERT.
- The seed at [`docs/seeds/products-adele-frizzell-llc.sql`](./seeds/products-adele-frizzell-llc.sql) is a good template for shape + JSONB structure.

### Edit a quiz question's wording
- Today: edit `data/formSteps.ts`, commit, deploy
- Phase 3: dashboard text editor backed by Supabase overrides

### Provision a new client deployment
1. Get the org's `linkName` from the CareGLP backend (e.g. `apexmd`, `lumivera`, `breezemeds`, `options-medical-weight-loss`). This becomes the org's permanent slug
2. INSERT a row into Supabase `site_config` and `announcement` with that slug as `org_id` (see [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) for the exact SQL)
3. Set the deployment's `.env`:
   - `NUXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (shared across orgs)
   - `NUXT_PUBLIC_ORG_ID` (matches the slug you used)
   - Org-specific Stripe and CareValidate keys
4. Customize `data/common.json` (orgName, colors, etc.) and the logo / favicon for this client
5. Deploy
