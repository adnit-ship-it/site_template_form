# Architecture Overview

This document describes the structure, data flow, and key patterns of the medical intake form application. It also catalogues dead code, unused files, and improvement opportunities.

---

## Technology Stack

- **Framework:** Nuxt 4 (Vue 3, Nitro server)
- **Styling:** Tailwind CSS, CSS custom properties for branding
- **Payments:** Stripe Elements (card, address, BNPL via Affirm/Klarna/Afterpay)
- **Analytics:** dataLayer (GTM-compatible), Customer.io, Everflow, GA4
- **Persistence:** localStorage for quiz progress and checkout state
- **Deployment:** Vercel (preset auto-detected), AWS Amplify (amplify.yml)

---

## Directory Structure

```
site_template_form/
├── app.vue                     # Shell: NuxtLayout + AnnouncementBar + CSS vars
├── nuxt.config.ts              # Runtime config, plugins, modules, CSP
├── pages/
│   ├── index.vue               # Quiz / intake form (layout: consultation)
│   ├── checkout.vue            # Product selection + payment (layout: checkout)
│   ├── welcome.vue             # Post-payment confirmation (layout: checkout)
│   ├── brand-snapshot.vue      # Standalone branding preview (no layout)
│   ├── terms.vue               # Terms of service
│   ├── privacy.vue             # Privacy policy
│   ├── privacy-practices.vue   # Notice of privacy practices
│   └── medical-consent.vue     # Telemedicine consent
├── layouts/
│   ├── default.vue             # Navbar + footer (used by legal pages)
│   ├── consultation.vue        # Navbar only (quiz)
│   ├── checkout.vue            # Minimal (checkout + welcome)
│   └── glp1.vue                # Alternate layout (currently unused)
├── components/
│   ├── checkout/               # Stripe elements, product/plan selection, payment
│   ├── form/                   # Step layout, header, progress tracker, inputs/
│   ├── layout/                 # Navbar, Footer, AnnouncementBar
│   └── ui/                     # Reusable cards, buttons, containers
├── composables/
│   ├── usePatientForm.ts       # Core quiz state, navigation, disqualification
│   ├── useCheckout.ts          # Checkout step state, product selection
│   ├── useFormPersistence.ts   # localStorage save/restore for quiz progress
│   ├── useStripe.ts            # Stripe client secret management
│   ├── useEnvMode.ts           # Staging/prod environment detection
│   ├── useIsEmbedded.ts        # Iframe embed detection
│   ├── useCustomerio.ts        # Customer.io event tracking
│   ├── useEverflow.ts          # Everflow conversion tracking
│   ├── useFingerprint.ts       # FingerprintJS (dormant)
│   ├── useFormState.ts         # Legacy progress state for default layout
│   ├── useNavbarBack.ts        # Navbar back-button behavior
│   ├── useInactivityTimer.ts   # User idle detection
│   ├── useCommon.ts            # Brand/common data access
│   └── useFaqs.ts              # FAQ fetching (unused)
├── data/
│   ├── formSteps.ts            # ~3,300 lines of step/question definitions
│   ├── quizConfigs.ts          # Quiz ID -> steps + progress mapping
│   ├── products.ts             # Product catalog (imports productsList.json)
│   ├── common.json             # Brand tokens, strings, colors
│   ├── common-helpers.ts       # TypeScript types for common.json
│   ├── hostTemplate.json       # Unused template metadata
│   └── intake-form/
│       └── productsList.json   # Product variation definitions
├── utils/
│   ├── buildFormPayload.ts     # Original API payload builder
│   ├── buildFormPayloadNew.ts  # New API payload builder (USE_NEW_API flag)
│   ├── submitPatientForm.ts    # Form submission orchestrator
│   ├── validation.ts           # Field validation rules
│   ├── calculations.ts         # BMI and medical value calculations
│   ├── componentMapper.ts      # Question type -> Vue component resolver
│   ├── dataLayer.ts            # GTM dataLayer push helper
│   ├── textInterpolation.ts    # {{firstName}}-style string replacement
│   ├── convertFile.ts          # File -> base64 conversion
│   ├── scrollToTop.ts          # Scroll utilities
│   └── camelToSnake.ts         # Case conversion
├── server/
│   ├── api/
│   │   ├── submit-form.post.ts         # -> CareValidate /dynamic-case or /cases
│   │   ├── create-setup-intent.post.ts # Stripe SetupIntent creation
│   │   ├── create-payment-intent.post.ts # Stripe PaymentIntent (BNPL)
│   │   ├── validate-promo.get.ts       # Promo code validation
│   │   ├── crm-data.get.ts             # Unused
│   │   ├── confirm-payment-setup.post.ts # Unused
│   │   ├── payment-confirmation.post.ts  # Unused
│   │   └── faqs.get.ts                 # Unused (tied to dormant useFaqs)
│   └── utils/
│       └── envMode.ts          # Staging/prod API key + URL resolution
├── plugins/
│   ├── 00.brand-tokens.ts              # Injects CSS custom properties
│   ├── preserve-tracking-params.client.ts
│   ├── checkout-redirect.client.ts
│   ├── toast.client.ts
│   ├── motion.client.ts / .server.ts
│   ├── embed-api-headers.client.ts
│   ├── google-analytics.client.ts      # Commented out in config
│   ├── customerio.client.ts            # Commented out in config
│   ├── everflow.client.ts              # Commented out in config
│   ├── everflow-click.client.ts        # Commented out in config
│   └── inactivity-tracker.client.ts
├── types/
│   ├── form.ts                 # FormStep, FormQuestion, QuizConfig, etc.
│   ├── checkout.ts             # Product, Category, PlanType, helpers
│   ├── global.d.ts             # Window extensions
│   ├── nuxt.d.ts               # Nuxt plugin type augmentation
│   └── everflow-client.d.ts    # Everflow SDK types
└── docs/
    ├── EMBED.md                # Iframe embedding guide
    └── ARCHITECTURE.md         # This file
```

---

## Core Data Flows

### Quiz Flow

```
User lands on /
        │
        ▼
pages/index.vue (layout: consultation)
        │
        ├─ usePatientForm() initializes
        │   ├─ Resolves quizId from URL params (productId/categoryId)
        │   ├─ Loads quiz config via getQuizById() from data/quizConfigs.ts
        │   ├─ useFormPersistence() restores saved answers + step from localStorage
        │   └─ Computes visibleSteps (filtered by renderCondition)
        │
        ├─ Renders: FormProgressTracker + FormHeader + FormStepLayout
        │   └─ StepLayout uses componentMapper to render question types dynamically
        │
        ├─ Next button advances currentStepIndex through visibleSteps
        │   └─ pushDataLayer({ event: 'click_continue' }) on each advance
        │
        └─ Last step → finishQuiz()
            ├─ Disqualification check (optional review screen)
            ├─ Sets localStorage quiz_<id>_completed = true
            ├─ Everflow completeQuiz, Customer.io completedQuiz
            └─ navigateTo('/checkout?categoryId=...')
```

### Checkout Flow

```
User arrives at /checkout
        │
        ▼
pages/checkout.vue (layout: checkout)
        │
        ├─ Guards: redirects to / if quiz not completed or missing category
        │
        ├─ Step 1: CheckoutVariationSelection
        │   ├─ Displays product cards from data/products.ts
        │   ├─ User selects product → CheckoutFrequencySelector for plan
        │   └─ advance-to-payment → useCheckout().nextStep()
        │
        └─ Step 2: CheckoutPaymentStep
            ├─ StripeAddressOnly — shipping address via Stripe Address Element
            ├─ StripePaymentOnly — card via Stripe Payment Element
            │   (or StripeBNPLPayment for Affirm/Klarna/Afterpay)
            ├─ Promo code validation via /api/validate-promo
            │
            └─ Submit:
                ├─ Stripe confirmSetup (card) or confirmPayment (BNPL)
                ├─ buildFormPayload() or buildFormPayloadNew() assembles payload
                ├─ POST /api/submit-form → CareValidate API
                ├─ Everflow caseCreated, Customer.io completedPurchase
                └─ navigateTo('/welcome?confirmation=...')
```

### State Persistence

```
useFormPersistence(quizId)
        │
        ├─ Saves to: localStorage quiz_<id>_data (answers)
        │             localStorage quiz_<id>_step (step index)
        │
        ├─ On mount: restoreClientState() merges saved data with defaults
        │            Resumes user at their last completed step
        │
        ├─ Auto-save: watch on formAnswers + currentStepIndex
        │
        └─ On quiz complete: clearLocalStorage() wipes all quiz keys
```

---

## Key Architectural Patterns

### Quiz-Config-Driven Forms
All quiz content is declared in `data/formSteps.ts` (step/question definitions) and `data/quizConfigs.ts` (which steps to use, progress bar labels, step-to-progress mappings). Adding a new quiz means defining a new step array and config entry — no component changes needed.

### Dynamic Component Rendering
`utils/componentMapper.ts` maps question `type` strings (e.g., `SINGLESELECT`, `FILE`, `MARKETING`) to Vue components. `StepLayout.vue` uses `<component :is="getComponentForQuestion(q)">` to render any question type.

### White-Label Branding
`data/common.json` is the single source of truth for brand name, colors, fonts, and strings. The `00.brand-tokens.ts` plugin injects these as CSS custom properties at startup. `nuxt.config.ts` reads the same file for SEO meta tags.

### Dual Environment Support
`server/utils/envMode.ts` and `composables/useEnvMode.ts` resolve staging vs production API keys and Stripe keys. When the app is embedded in an iframe (detected via `useIsEmbedded`), it can route to staging APIs.

### Feature Flags
- `USE_NEW_API` — switches between `buildFormPayload` (old) and `buildFormPayloadNew` (new), and changes the submission endpoint from `/dynamic-case` to `/cases`.
- `NUXT_PUBLIC_BNPL_ACTIVATED` — enables/disables Buy Now Pay Later payment options.

---

## Tracking IDs Reference

The following semantic IDs are placed on DOM elements for analytics and QA automation:

| ID / Selector | Element | Location |
|---|---|---|
| `#question-{stepId}` | Quiz step container (dynamic per step) | `components/form/StepLayout.vue` |
| `#begin-quiz` | Next button when on first quiz step | `pages/index.vue` |
| `#finish-quiz` | Next button when on last quiz step | `pages/index.vue` |
| `#select-product` | Product variation cards container | `components/checkout/VariationSelection.vue` |
| `#product-{variationId}` | Individual product card | `components/checkout/VariationSelection.vue` |
| `.selected-product` | CSS class on currently selected product | `components/checkout/VariationSelection.vue` |
| `#checkout` | Payment step wrapper | `pages/checkout.vue` |
| `#checkout-submit` | Payment submit button | `components/checkout/PaymentStep.vue` |
| `#payment-success` | Confirmation card on welcome page | `pages/welcome.vue` |

---

## Dead Code and Unused Files

### Unused Components (13)

| Component | Notes |
|---|---|
| `components/ProductCardAlt.vue` | No references in app code |
| `components/CTAWithTrust.vue` | No references |
| `components/ui/ProductCard.vue` | No references |
| `components/ui/BmiCalculator.vue` | No references |
| `components/ui/HexagonImage.vue` | Only referenced in a prompt doc |
| `components/form/inputs/WeightSummary.vue` | Superseded by `WeightSummaryDisplay.vue` |
| `components/form/Navigation.vue` | No references (inline nav in index.vue) |
| `components/checkout/Navigation.vue` | No references |
| `components/checkout/ProductSelection.vue` | Replaced by `VariationSelection.vue` |
| `components/checkout/StripeAddressSection.vue` | Replaced by `StripeAddressOnly.vue` |
| `components/checkout/StripePaymentSection.vue` | Replaced by `StripePaymentOnly.vue` |
| `components/checkout/ShippingDestinationModal.vue` | Orphaned state in checkout.vue but no template usage |
| `components/checkout/InsufficientFundsModal.vue` | No references |

### Unused Composables

| File | Notes |
|---|---|
| `composables/useFaqs.ts` | Never called; `server/api/faqs.get.ts` is unreachable |
| `composables/useFingerprint.ts` | Only in commented plugin code |

### Unused Server Routes

| Route | Notes |
|---|---|
| `server/api/crm-data.get.ts` | No `$fetch('/api/crm-data')` calls in app |
| `server/api/confirm-payment-setup.post.ts` | No client references |
| `server/api/payment-confirmation.post.ts` | No client references |
| `server/api/faqs.get.ts` | Only called from dormant `useFaqs` |

### Unused Exports

| Export | File |
|---|---|
| `scrollToTopWithFallback` | `utils/scrollToTop.ts` |
| `registerComponent` | `utils/componentMapper.ts` |
| `getRegisteredTypes` | `utils/componentMapper.ts` |

### Unused Data Files

| File | Notes |
|---|---|
| `data/hostTemplate.json` | Zero code references |

### Broken References

| Issue | Location |
|---|---|
| `layouts/glp1.vue` uses `<FooterAlt>` which does not exist | No page uses this layout |
| Trust badge images (trustpilot.png, hipaa.png, made-usa.jpg) referenced in `pages/index.vue` may not exist under `public/` | Lines 97-99, 119-121 |

### Dormant Environment Variables

| Variable | Notes |
|---|---|
| `ENABLE_BNPL` (server runtimeConfig) | Defined but never read by any server code |
| `NUXT_PUBLIC_FINGERPRINT_API_KEY` | Only used in dormant `useFingerprint` |
| `NUXT_PUBLIC_EF_BASE_URL` / `NUXT_PUBLIC_EF_API_KEY` | Everflow plugins are commented out |

---

## Architectural Improvement Suggestions

### 1. Consolidate Payload Builders
`buildFormPayload.ts` and `buildFormPayloadNew.ts` duplicate significant question-processing logic. Extract shared question assembly into a single function and have each builder compose it differently for their respective API contracts.

### 2. Fix Analytics Plugin Wiring
`useEverflow()` calls `nuxtApp.$efTrack` and `useCustomerio()` calls `nuxtApp.$cioanalytics`, but the plugins that provide these are commented out in `nuxt.config.ts`. These composables silently fail at runtime. Either re-enable the plugins or add explicit null-checks so the composables are safe to call without providers.

### 3. Unify Progress State
`useFormState.ts` defines `useFormSteps()` / `useCurrentFormStep()` for `layouts/default.vue`, while `usePatientForm.ts` manages its own `progressSteps` for the quiz. The shared `useState('currentFormStep')` key is reset in `submitPatientForm.ts`, creating a fragile coupling. Consider removing `useFormState.ts` entirely and routing all progress through `usePatientForm`.

### 4. Clean Up Checkout Orphans
`pages/checkout.vue` declares `showShippingModal`, `frequencySelectorRef`, and shipping modal handlers that have no corresponding template elements. These are leftover from removed features and should be cleaned up.

### 5. Extract Promo Code Logic
The promo code validation, display, and discount calculation in `PaymentStep.vue` (~100 lines of logic) could move to a `usePromoCode()` composable, making PaymentStep easier to maintain and the promo logic reusable.

### 6. Remove Dead Code
The 13 unused components, 4 unused server routes, and orphaned composables add maintenance burden and bundle size. A cleanup pass would reduce cognitive load for new contributors.
