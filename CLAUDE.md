# CLAUDE.md

This repository is a Nuxt 4 medical intake and checkout application with dynamic quiz flows, Stripe payment collection (card + BNPL), and server-side submission to CareValidate.

Use this file as the operational guide for making safe changes.

## Quick Start

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Tests: `npm run test:run`

## Tech Stack

- Nuxt 4 + Vue 3 + Nitro server routes
- Tailwind CSS + CSS custom properties from `data/common.json`
- Stripe Elements for setup/payment intents
- Runtime integrations for GTM-style data layer, Everflow, Customer.io
- Vitest for unit tests

## Project Map (Most Important Files)

- App shell and layouts:
  - `app.vue`
  - `layouts/consultation.vue`
  - `layouts/checkout.vue`
  - `layouts/default.vue`
- Primary pages:
  - `pages/index.vue` (301 redirect to `/consultation`)
  - `pages/consultation.vue` (quiz flow)
  - `pages/checkout.vue` (product + payment flow)
  - `pages/confirmation.vue` (success page + tracking)
- Core state/composables:
  - `composables/usePatientForm.ts` (quiz state and progression)
  - `composables/useCheckout.ts` (checkout state machine)
  - `composables/useFormPersistence.ts` (localStorage state)
  - `composables/useStripe.ts` (Stripe init and secrets)
  - `composables/useEnvMode.ts` + `composables/useIsEmbedded.ts`
- Quiz and product data:
  - `data/quizConfigs.ts` (quiz registry + lazy loaders)
  - `data/formSteps.ts` (step/question definitions)
  - `data/common.json` (branding, metadata, default quiz)
  - `composables/useProductsCatalog.ts` (DB-backed product/category catalog)
  - `server/api/products.get.ts` (full catalog endpoint)
  - `server/api/products/[productId].get.ts` (per-product `quizId` lookup)
  - `plugins/02.products-catalog.ts` (one-shot plugin that pins catalog into `useState`)
- Submission and payload building:
  - `utils/submitPatientForm.ts`
  - `utils/buildFormPayload.ts` (legacy API shape)
  - `utils/buildFormPayloadNew.ts` (new API shape)
- Server API routes:
  - `server/api/submit-form.post.ts`
  - `server/api/create-setup-intent.post.ts`
  - `server/api/create-payment-intent.post.ts`
  - `server/utils/envMode.ts`
- Nuxt/runtime config:
  - `nuxt.config.ts`

## Core Runtime Model

### 1) Quiz Selection and Progression

- The active quiz is selected from URL query:
  - Prefer `productId` — the slug is resolved to a `quizId` server-side via `/api/products/[productId]` (Supabase `products` table for the current `org_id`). `pages/consultation.vue` awaits that lookup before initializing the form composable.
  - Else use `categoryId` — taken as the `quizId` directly.
  - Else fallback to the default quiz: `site_config.default_quiz_id_override` (Supabase) or `DEFAULT_QUIZ_ID` from `data/common.json`.
- `data/quizConfigs.ts` lazily loads quiz step arrays and caches by ID.
- `usePatientForm` computes visible steps via `renderCondition`, persists answers, and drives the progress marker mapping.
- The full products/categories catalog is fetched once per page load by `plugins/02.products-catalog.ts` (`/api/products`) and exposed synchronously via `useProductsCatalog()`.

### 2) Consultation -> Checkout Transition

- Quiz completion is stored as `quiz_<quizId>_completed` in localStorage.
- `finishQuiz()` in `usePatientForm` performs disqualification checks, tracking calls, and navigates to `/checkout` while preserving tracking params.
- `pages/consultation.vue` can auto-redirect directly to checkout when completion data already exists.

### 3) Checkout and Payment

- `pages/checkout.vue` has a two-step flow:
  - Step 1: product/plan selection
  - Step 2: payment and submission
- Card path confirms Stripe setup, then calls `submitPatientForm`.
- BNPL path stores checkpoint data, redirects, then restores and completes submission on return.

### 4) Submission

- `utils/submitPatientForm.ts` decides payload builder using `runtimeConfig.public.useNewAPI`.
- `/api/submit-form` forwards to CareValidate:
  - New API: `/cases`
  - Legacy API: `/dynamic-case`
- On success, the app clears persisted quiz state and navigates to `/confirmation`.

## Embed Mode (Critical Behavior)

- Embed detection is client-side via iframe check (`useIsEmbedded`) and fetch header injection in `plugins/embed-api-headers.client.ts`.
- For embedded sessions (`x-embed-mode: 1`), server routes intentionally use staging credentials/URLs (`server/utils/envMode.ts`).
- In embed mode, BNPL is intentionally disabled; card flow remains supported.
- CSP `frame-ancestors` comes from `NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS` in `nuxt.config.ts`.

## Branding and White-Labeling

- `data/common.json` is the source of truth for:
  - brand colors
  - site metadata
  - default quiz ID
  - announcement bar settings
- `plugins/00.brand-tokens.server.ts` injects CSS custom properties from common data and resolved font stacks.
- Keep Tailwind and runtime brand values aligned when changing theme tokens.

## Development Guardrails

- Keep quiz behavior data-driven:
  - Prefer changes in `data/formSteps.ts` and `data/quizConfigs.ts` over hardcoded page logic.
- Preserve query param passthrough for attribution:
  - UTM and affiliate params are intentionally forwarded across pages.
- Do not break localStorage key contracts:
  - `quiz_<id>_data`, `quiz_<id>_step`, `quiz_<id>_completed`
  - BNPL keys: `checkout_step1_data`, `bnpl_product_data`
- Treat payload IDs carefully:
  - `productBundleId` (variation `id`) vs legacy bundle ID (variation `bundleId`) are intentionally distinct.
- Keep client/server embed routing in sync when changing environment logic.

## Where to Edit for Common Tasks

- Add or modify quiz questions:
  - `data/formSteps.ts`
  - `data/quizConfigs.ts`
  - `types/form.ts` (if schema changes)
- Add a new quiz:
  - register loader and mapping in `data/quizConfigs.ts`
  - ensure product mapping in the Supabase `products` table (`quiz_id` column on each product row)
  - verify default/fallback behavior in `data/common.json` (and `site_config.default_quiz_id_override` in Supabase)
- Change product cards/plan pricing:
  - Supabase `products` and `categories` tables (see [docs/SUPABASE_SCHEMA.md](docs/SUPABASE_SCHEMA.md))
  - `types/checkout.ts` helpers
  - `components/checkout/VariationSelection.vue`
- Change payment flow:
  - `components/checkout/PaymentStep.vue`
  - `pages/checkout.vue`
  - `composables/useStripe.ts`
  - `server/api/create-setup-intent.post.ts` and/or `server/api/create-payment-intent.post.ts`
- Change submission payload/API integration:
  - `utils/buildFormPayload.ts`
  - `utils/buildFormPayloadNew.ts`
  - `utils/submitPatientForm.ts`
  - `server/api/submit-form.post.ts`

## Testing Expectations

- Run `npm run test:run` after meaningful changes.
- Existing tests are in `test/unit` and cover:
  - validation utilities
  - branding/common token contract
- For quiz/checkout/payment changes, also do manual verification:
  - consultation progression and conditional steps
  - checkout step transitions
  - card payment happy path
  - BNPL return path (if touched)
  - confirmation navigation
  - embed mode behavior if env/header logic changes

## Known Constraints and Gotchas

- `pages/index.vue` is redirect-only; do not implement quiz flow there.
- Analytics plugins may be toggled/commented in `nuxt.config.ts`; check plugin wiring before assuming availability.
- Some legacy/orphan code exists; avoid broad cleanup unless explicitly requested.
- This app depends heavily on browser storage; SSR-safe guards are required for `window`/`localStorage` access.

## If You Are Unsure

- Prefer minimal, reversible changes in a small set of files.
- Validate end-to-end flow for the touched path, not only type checks.
- Preserve existing API field names and localStorage contracts unless migration is explicitly in scope.
