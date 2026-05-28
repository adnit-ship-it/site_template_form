# Supabase Schema (Reader Contract)

This document defines the exact schema this app expects in Supabase. The app
is a pure **reader** — it never runs migrations, never seeds, never writes.
The dashboard app (separate codebase) is the writer and owns provisioning.

Use the `CREATE TABLE` statements below verbatim in the Supabase SQL editor
when standing up a new project. Once tables exist and at least one row per
table is populated for your `org_id`, the reader app starts serving live
data automatically (after restart or webhook invalidation).

Until tables exist or rows are missing, the app falls back to
`DEFAULT_RUNTIME_CONFIG` / `DEFAULT_BRANDING` defined in
[`types/runtime-config.ts`](../types/runtime-config.ts) and
[`data/default-branding.ts`](../data/default-branding.ts) — so deployments
without Supabase wired still render correctly.

---

## Conventions

- **Every table has an `org_id text`** column (primary key on the per-org
  tables). The reader filters all queries by it; the dashboard scopes all
  writes by it. See "Multi-tenancy" below.
- **`org_id` is a slug, not a UUID** — it matches the org's `linkName` from
  the CareGLP backend (e.g. `apexmd`, `lumivera`, `breezemeds`,
  `options-medical-weight-loss`). A CHECK constraint on every table enforces
  the slug format.
- **Column naming is `snake_case`** at the DB layer; the reader maps to
  `camelCase` when returning to consumers (see `server/api/runtime-config.get.ts`).
  Stick to snake_case in SQL to keep PostgREST happy.
- **`updated_at` everywhere**, populated by a trigger. Lets the dashboard
  display "last edited" and lets the webhook payload include the new value.

---

## Multi-tenancy

This Supabase project is shared across many client deployments. The reader
in each Vercel deployment is stamped with `NUXT_PUBLIC_ORG_ID=<slug>` (the
org's `linkName` from CareGLP, e.g. `apexmd`). The service-role client on
the server filters every read by that slug:

```sql
select … from site_config where org_id = 'apexmd';
```

**RLS is on** as defense-in-depth. The reader uses the service-role key
which bypasses RLS, but if the dashboard ever exposes the anon key or
per-user JWTs to any client, RLS prevents accidental cross-org reads. Each
table has an explicit `service_role` policy below; no other policies means
no anon/authenticated access.

See the "Architecture decisions" section at the bottom for the chosen
dashboard → Supabase write pattern.

---

## Trigger function for `updated_at`

Run once in the project. Used by every table below.

```sql
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

---

## `site_config`

One row per org. Holds feature flags + integration ids that the reader
fetches via `/api/runtime-config`.

```sql
create table site_config (
  org_id                       text         primary key,
  bnpl_activated               boolean      not null default true,
  home_url                     text         not null default 'https://example.com/',
  use_new_api                  boolean      not null default true,
  use_stripe                   boolean      not null default true,
  everflow_base_url            text         not null default '',
  everflow_offer_id            text         not null default '',
  everflow_event_ids           jsonb        not null default '[]'::jsonb,
  default_quiz_id_override     text                                  ,  -- null = use repo default
  updated_at                   timestamptz  not null default now(),
  constraint site_config_org_id_is_slug
    check (org_id ~ '^[a-z0-9][a-z0-9-]*$' and char_length(org_id) <= 128),
  constraint site_config_everflow_event_ids_is_array
    check (jsonb_typeof(everflow_event_ids) = 'array')
);

create trigger site_config_set_updated_at
  before update on site_config
  for each row execute procedure set_updated_at();

alter table site_config enable row level security;

create policy site_config_service_role_all on site_config
  for all to service_role using (true) with check (true);
```

### Column reference

| Column | Type | Maps to (app) | Notes |
|---|---|---|---|
| `org_id` | text PK (slug) | (filter) | Lowercase slug matching the org's `linkName` from CareGLP (e.g. `apexmd`). Must match `NUXT_PUBLIC_ORG_ID` for the deployment. CHECK constraint enforces `^[a-z0-9][a-z0-9-]*$` and length ≤ 128 |
| `bnpl_activated` | bool | `siteConfig.bnplActivated` | Shows/hides BNPL payment option. Also gated by `useIsEmbedded()` |
| `home_url` | text | `siteConfig.homeUrl` | Confirmation page "Go home" CTA |
| `use_new_api` | bool | `siteConfig.useNewAPI` | True = `/cases` endpoint + new builder; false = `/dynamic-case` + old builder |
| `use_stripe` | bool | `siteConfig.useStripe` | True (default) = collect card via Stripe Elements; BNPL available (subject to `bnpl_activated` + embed). False = collect card via NMI Collect.js (the Stripe Address Element is still used for shipping); BNPL always hidden; submission sends `nmiPaymentToken` instead of a Stripe id |
| `everflow_base_url` | text | `siteConfig.everflowBaseUrl` | For dormant Everflow plugins |
| `everflow_offer_id` | text | `siteConfig.everflowOfferId` | Per-campaign |
| `everflow_event_ids` | jsonb (array) | `siteConfig.everflowEventIds` | Array of named events: `[{ name: "Begin Quiz", id: 111 }, …]`. Lets you map multiple Everflow events from one row without a fixed schema slot per event. CHECK constraint enforces "is an array"; per-object shape is enforced informally by the `EverflowEvent` TypeScript type |
| `default_quiz_id_override` | text nullable | `siteConfig.defaultQuizIdOverride` | Optional hot-swap override of `site_branding.default_quiz_id`. Null = use branding default |
| `updated_at` | timestamptz | (not exposed) | Trigger-managed |

### Example INSERT for a new org

```sql
insert into site_config (
  org_id,
  bnpl_activated,
  home_url,
  use_new_api,
  use_stripe,
  everflow_base_url,
  everflow_offer_id,
  everflow_event_ids,
  default_quiz_id_override
) values (
  'apexmd',                                        -- replace with the org's CareGLP linkName
  true,
  'https://hormoneexpertsclinic.com/',
  true,
  true,                                            -- use_stripe; set false to use NMI for cards
  '',
  '',
  '[]'::jsonb,
  null
);
```

To seed with named events from the start:

```sql
insert into site_config (org_id, everflow_event_ids)
values (
  'apexmd',
  '[
    {"name": "Begin Quiz",    "id": 111},
    {"name": "Submit Form",   "id": 222},
    {"name": "Purchase",      "id": 333}
  ]'::jsonb
);
```

### Adding `use_stripe` to an existing project (migration)

`use_stripe` was added after the initial schema. For projects whose
`site_config` table predates it, run this one-time statement in the Supabase
SQL editor. It's idempotent (`if not exists`) and defaults existing/new rows to
Stripe (`true`), so it's a no-op behavior change until you flip an org to
`false`.

```sql
alter table site_config add column if not exists use_stripe boolean not null default true;
```

To switch an org to NMI card collection afterward:

```sql
update site_config set use_stripe = false where org_id = 'apexmd';
```

---

## `site_branding`

One row per org. Brand identity formerly in `data/common.json`: org name,
SEO strings, color tokens, and the canonical default quiz id. Fetched with
`site_config` and `announcement` via `/api/runtime-config`.

```sql
create table site_branding (
  org_id            text         primary key,
  org_name          text         not null,
  site_title        text         not null,
  page_description  text         not null,
  colors            jsonb        not null default '{}'::jsonb,
  default_quiz_id   text,
  updated_at        timestamptz  not null default now(),
  constraint site_branding_org_id_fk
    foreign key (org_id) references site_config(org_id) on delete cascade,
  constraint site_branding_org_id_is_slug
    check (org_id ~ '^[a-z0-9][a-z0-9-]*$' and char_length(org_id) <= 128),
  constraint site_branding_colors_is_object
    check (jsonb_typeof(colors) = 'object')
);

create trigger site_branding_set_updated_at
  before update on site_branding
  for each row execute procedure set_updated_at();

alter table site_branding enable row level security;

create policy site_branding_service_role_all on site_branding
  for all to service_role using (true) with check (true);
```

### Column reference

| Column | Type | Maps to (app) | Notes |
|---|---|---|---|
| `org_id` | text PK (slug) | (filter) | Same slug as `site_config.org_id` |
| `org_name` | text | `branding.brand.orgName` | Policy pages, SMS copy, `runtimeConfig.public.orgName` |
| `site_title` | text | `branding.strings.siteTitle` | HTML `<title>`, OG/Twitter titles |
| `page_description` | text | `branding.strings.pageDescription` | Meta description, OG/Twitter description |
| `colors` | jsonb object | `branding.brand.colors` | Keys: `backgroundColor`, `bodyColor`, `accentColor1`, `accentColor2`, `backgroundColor2` (hex strings). Injected as `:root` CSS variables (`--token` + `--token-rgb`); Tailwind utilities (`bg-accentColor1`, `text-accentColor1/80`, etc.) read those vars at runtime |
| `default_quiz_id` | text nullable | `branding.quiz.defaultQuizId` | Canonical default quiz; overridden by `site_config.default_quiz_id_override` when set |
| `updated_at` | timestamptz | (not exposed) | |

Font files remain in `assets/fonts/` (not in this table).

### Troubleshooting: page still shows `data/common.json` values

1. **`NUXT_PUBLIC_ORG_ID` must exactly match `site_branding.org_id`** (e.g. `acuwellmd`, lowercase).
2. **`NUXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`** must be set on the deployment.
3. Check **Vercel/server logs** for `[runtime-config]` warnings — fallbacks always log; successful DB loads log `site_branding: LOADED from DB`.
4. Optional verbose logs: `DEBUG_RUNTIME_CONFIG=1` (server) and `NUXT_PUBLIC_DEBUG_SITE_BOOTSTRAP=1` (client plugin).

### Example INSERT for a new org

```sql
insert into site_branding (
  org_id,
  org_name,
  site_title,
  page_description,
  colors,
  default_quiz_id
) values (
  'apexmd',
  'Apex MD',
  'Apex MD - Discover a better you with GLP-1s.',
  'Apex MD is made personalized for you and your weight loss journey.',
  '{
    "backgroundColor": "#F6F6F6",
    "bodyColor": "#000000",
    "accentColor1": "#112641",
    "accentColor2": "#112641",
    "backgroundColor2": "#F6F6F6"
  }'::jsonb,
  'weight-loss'
);
```

---

## `announcement`

One row per org. Drives the announcement bar at the top of every page (see
`components/layout/AnnouncementBar.vue`). When `enabled = false` the bar is
omitted and the `--site-announcement-height` CSS var goes to `0px`.

```sql
create table announcement (
  org_id            text         primary key,
  enabled           boolean      not null default false,
  text              text         not null default '',
  background_color  text         not null default '#000000',
  text_color        text         not null default '#ffffff',
  updated_at        timestamptz  not null default now(),
  constraint announcement_org_id_is_slug
    check (org_id ~ '^[a-z0-9][a-z0-9-]*$' and char_length(org_id) <= 128)
);

create trigger announcement_set_updated_at
  before update on announcement
  for each row execute procedure set_updated_at();

alter table announcement enable row level security;

create policy announcement_service_role_all on announcement
  for all to service_role using (true) with check (true);
```

### Column reference

| Column | Type | Maps to (app) | Notes |
|---|---|---|---|
| `org_id` | text PK (slug) | (filter) | Same slug as in `site_config.org_id`. CHECK constraint enforces slug format |
| `enabled` | bool | `announcement.enabled` | When false the entire bar is hidden |
| `text` | text | `announcement.text` | Shown in the bar |
| `background_color` | text | `announcement.backgroundColor` | CSS color (hex or rgb) |
| `text_color` | text | `announcement.textColor` | CSS color |
| `updated_at` | timestamptz | (not exposed) | |

**Note: no `link` column.** The link target is hardcoded to `/consultation`
in the AnnouncementBar component. The bar auto-suppresses the link when the
user is already on `/consultation` or `/checkout` (so the click doesn't
take them to the page they're already on).

### Example INSERT for a new org

```sql
insert into announcement (
  org_id,
  enabled,
  text,
  background_color,
  text_color
) values (
  'apexmd',                                        -- replace with the org's CareGLP linkName
  false,
  'Limited time offer: 20% off your first consultation!',
  '#000000',
  '#ffffff'
);
```

---

## `categories`

One row per (org, category) pair. Categories group products in the consultation
flow and on the checkout product picker. Replaces the top-level `categories[]`
array from `data/intake-form/productsList.json`.

```sql
create table categories (
  org_id        text         not null,
  id            text         not null,
  name          text         not null,
  images        jsonb        not null default '{}'::jsonb,
  availability  text         not null default 'in_stock',
  updated_at    timestamptz  not null default now(),
  primary key (org_id, id),
  constraint categories_org_id_fk
    foreign key (org_id) references site_config(org_id) on delete cascade,
  constraint categories_org_id_is_slug
    check (org_id ~ '^[a-z0-9][a-z0-9-]*$' and char_length(org_id) <= 128),
  constraint categories_id_is_slug
    check (id ~ '^[a-z0-9][a-z0-9-]*$' and char_length(id) <= 128),
  constraint categories_availability_check
    check (availability in ('in_stock', 'out_of_stock'))
);

create trigger categories_set_updated_at
  before update on categories
  for each row execute procedure set_updated_at();

alter table categories enable row level security;

create policy categories_service_role_all on categories
  for all to service_role using (true) with check (true);
```

### Column reference

| Column | Type | Maps to (app) | Notes |
|---|---|---|---|
| `org_id` | text (slug) | (filter) | Composite PK part 1. Same slug as `site_config.org_id`. FK to `site_config(org_id)` with `ON DELETE CASCADE` so deleting an org wipes its categories. CHECK enforces slug format |
| `id` | text (slug) | `category.id` | Composite PK part 2. Lowercase slug like `weight-loss`, `hrt`, `sexual-health`. CHECK enforces slug format |
| `name` | text | `category.name` | Display name like `Weight Loss` |
| `images` | jsonb | `category.images` | Object with at least `mainImg`; e.g. `{"mainImg":"/assets/images/products/weight-loss/cover.png"}`. JSONB so additional image slots can be added without migrations |
| `availability` | text | `category.availability` | `'in_stock'` or `'out_of_stock'`. CHECK enforces the allowed values |
| `updated_at` | timestamptz | (not exposed) | Trigger-managed |

Composite primary key `(org_id, id)` means:

- A given org cannot have two categories with the same `id` (uniqueness via PK).
- Two different orgs CAN both have a category with the same `id` (e.g. both `apexmd` and `adele-frizzell-llc` may have a `weight-loss` category).

### Example INSERT for a new org

```sql
insert into categories (org_id, id, name, images, availability) values
  ('apexmd', 'weight-loss', 'Weight Loss',
   '{"mainImg":"/assets/images/products/weight-loss/cover.png"}'::jsonb,
   'in_stock');
```

---

## `products`

One row per (org, product) pair. Each product belongs to a single category for
the same org. Replaces the per-category `products[]` array from
`data/intake-form/productsList.json`. Pricing variants live inline as a JSONB
`variations` array (mirrors the JSON shape exactly — may be normalized into a
separate `product_variations` table in a later phase).

```sql
create table products (
  org_id          text         not null,
  id              text         not null,
  category_id     text         not null,
  name            text         not null,
  selection_name  text,
  quiz_id         text         not null,
  intro           text,
  type            text,
  images          jsonb        not null default '{}'::jsonb,
  tag             text,
  description     text,
  variations      jsonb        not null default '[]'::jsonb,
  availability    text         not null default 'in_stock',
  updated_at      timestamptz  not null default now(),
  primary key (org_id, id),
  constraint products_category_fk
    foreign key (org_id, category_id) references categories(org_id, id) on delete cascade,
  constraint products_org_id_is_slug
    check (org_id ~ '^[a-z0-9][a-z0-9-]*$' and char_length(org_id) <= 128),
  constraint products_availability_check
    check (availability in ('in_stock', 'out_of_stock')),
  constraint products_variations_is_array
    check (jsonb_typeof(variations) = 'array')
);

create index products_org_category_idx on products (org_id, category_id);

create trigger products_set_updated_at
  before update on products
  for each row execute procedure set_updated_at();

alter table products enable row level security;

create policy products_service_role_all on products
  for all to service_role using (true) with check (true);
```

### Column reference

| Column | Type | Maps to (app) | Notes |
|---|---|---|---|
| `org_id` | text (slug) | (filter) | Composite PK part 1. Implicitly FK'd to `categories(org_id, id)` via the composite FK below |
| `id` | text | `product.id` | Composite PK part 2. Slug like `compounded-semaglutide`, `kyzatrex`, `tadalafil` |
| `category_id` | text | (parent category) | Together with `org_id` references `categories(org_id, id)`. The composite FK guarantees the category belongs to the *same org* — you can never accidentally cross-link orgs |
| `name` | text | `product.name` | Display name |
| `selection_name` | text nullable | `product.selectionName` | Name shown in the checkout selection card. Falls back to `name` if null |
| `quiz_id` | text | `product.quizId` | Drives which quiz loads in `data/quizConfigs.ts`. Required because the consultation flow can't render without one |
| `intro` | text nullable | `product.intro` | Short subtitle on product cards |
| `type` | text nullable | `product.type` | Form factor: `injections`, `tablets`, `cream`, `drops`, `patch`, `spray`, … |
| `images` | jsonb | `product.images` | Object with at least `mainImg`. Same shape as `categories.images` |
| `tag` | text nullable | `product.tag` | Badge text like `Most Affordable`, `Fastest Results` |
| `description` | text nullable | `product.description` | Long-form description shown in the product detail view |
| `variations` | jsonb (array) | `product.variations` | Array of `{ duration, id, bundleId, price, refillPrice? }` objects. CHECK enforces "is an array". Edit pricing/durations/bundle ids in place without schema changes |
| `availability` | text | `product.availability` | `'in_stock'` or `'out_of_stock'`. CHECK enforces the allowed values |
| `updated_at` | timestamptz | (not exposed) | Trigger-managed |

Composite primary key `(org_id, id)` means:

- A given org cannot have two products with the same `id`.
- Two different orgs CAN both have a product with the same `id`.

The composite FK `(org_id, category_id) → categories(org_id, id)` makes
cross-org category links impossible: a product in `apexmd` can only point at a
category that exists for `apexmd`.

### Example INSERT for a new org

```sql
insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'apexmd',
  'compounded-semaglutide',
  'weight-loss',
  'Semaglutide Injection',
  'Semaglutide Injection',
  'weight-loss',
  'Proven, effective, more affordable.',
  'injections',
  '{"mainImg":"/assets/images/products/semaglutide-injection.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"1fb1f23a-a77a-40a5-b502-6685e9a1a887","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":269,"refillPrice":299}
  ]'::jsonb,
  'in_stock'
);
```

### How the app consumes these tables

The app is fully migrated off the legacy `data/intake-form/productsList.json`:

- [`server/api/products.get.ts`](../server/api/products.get.ts) returns the
  entire catalog (categories with nested products) for the current `org_id`.
  Cached 60s, mirrors the `runtime-config` pattern.
- [`server/api/products/[productId].get.ts`](../server/api/products/[productId].get.ts)
  resolves a single `productId` slug to its `quizId`. Used by
  `pages/consultation.vue` to drive quiz selection from URL params.
- [`plugins/02.products-catalog.ts`](../plugins/02.products-catalog.ts) fetches
  the catalog once per page load and pins it into `useState('products-catalog')`.
- [`composables/useProductsCatalog.ts`](../composables/useProductsCatalog.ts)
  reads from that state slot and exposes reactive `categories` / `products`
  refs to components and other composables.

Both endpoints are DB-only — there is no local-JSON fallback. If `org_id`
isn't configured or Supabase is unreachable, the catalog is empty and the
app's empty-state UX takes over.

### Notes

- The legacy seed JSON had a duplicated variation `id`
  (`04bedd32-ef96-48e3-af81-3011552598b3` appears twice for the
  `enclomiphene...` product — both `monthly` and `threeMonthly` reuse it).
  Because `variations` is JSONB, this is preserved as-is and won't error.
  Fix the source data separately if uniqueness inside the array becomes a
  requirement.

### Seeding initial content

A one-off, transactional, idempotent seed for `org_id = 'adele-frizzell-llc'`
lives at [`docs/seeds/products-adele-frizzell-llc.sql`](./seeds/products-adele-frizzell-llc.sql).
Run it in the Supabase SQL editor after creating the `categories` and
`products` tables above. It is safe to re-run; rows are upserted via
`ON CONFLICT … DO UPDATE`.

---

## Provisioning a new org checklist

1. Get the org's `linkName` from the CareGLP backend (e.g. `apexmd`,
   `lumivera`, `breezemeds`, `options-medical-weight-loss`). The dashboard
   should fetch this from the CareGLP org list and use it directly — no UUID
   generation needed. Confirm with the CareGLP team that `linkName` is
   immutable and unique before relying on it.
2. Run the `INSERT` statements above with that slug in both tables
   (`site_config` + `announcement` + `site_branding`).
3. Add the matching slug to the deployment's `.env`:
   ```
   NUXT_PUBLIC_ORG_ID=apexmd
   NUXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```
4. Redeploy. Visit any page; `useRuntimeConfigDB()` now reads from your rows.
5. (Optional, for instant publish) Wire up the Database Webhook per
   [SUPABASE_WEBHOOKS.md](./SUPABASE_WEBHOOKS.md).

---

## Future tables (Phase 2+)

These are planned but **not yet provisioned**. Documented here so the dashboard
team and reader-app contributors share a forward-looking picture.

- **`product_variations`** — eventual normalization of the `variations` JSONB
  column on `products`. Per-duration pricing + `bundle_id` (upstream pharmacy
  id) + variation `id` (local UUID, also used as `productBundleId` in URLs).
  For now, variations live inline as JSONB on `products` (see above).
- **`quizzes`**, **`quiz_step_overrides`**, **`quiz_question_overrides`** — Phase 3 overlays on top of the code templates in `data/formSteps.ts`.
- **`landing_page_sections`** — Phase 4, when the landing page feature ships.

Every one of these tables will use `org_id text` (same slug as `site_config`)
and the same `service_role`-only RLS policy template — see the architecture
decision below.

Concrete schemas land in this doc when each phase is implemented.

---

## Architecture decisions

### ADR-001: Dashboard → Supabase write path uses service-role through the dashboard backend (Option A)

**Decision (May 2026):** All Supabase writes go through the dashboard's
own backend using the service-role key. The dashboard frontend never talks
to Supabase directly. The reader app (this template) likewise uses the
service-role key on its server. Every table's RLS policy is identical:

```sql
alter table <name> enable row level security;
create policy <name>_service_role_all on <name>
  for all to service_role using (true) with check (true);
```

**Alternative considered:** per-user JWT writes where the dashboard
frontend talks directly to Supabase using a logged-in operator's JWT,
with RLS policies checking `auth.jwt() ->> 'org_id'` style claims.
Faster (no extra hop) but adds Supabase Auth integration to the
dashboard, makes RLS policies more complex, and makes it harder to
layer business logic / validation / audit logging between the UI and
the DB.

**Why service-role won:**

1. The dashboard already has a backend that holds the GitHub App
   credentials, Vercel API token, etc. The service-role key fits the
   same trust boundary.
2. Easier to add validation, audit logging (Task F3 in the Linear
   backlog), and rate-limiting in one place — the dashboard backend —
   instead of scattering it across RLS policies.
3. Simpler RLS policies = fewer footguns. Every table is "service_role
   only" and that's it.
4. Phase 2/3 tables (products, quizzes) follow the same pattern with
   zero schema redesign.
5. Reversible: if real-time collaborative editing or direct frontend
   writes ever become a requirement, add an additional RLS policy
   alongside the service_role one. No migration needed.

**Implications for new tables:** copy the RLS template above verbatim.
Don't add JWT-aware policies unless and until the decision is revisited.

**Implications for the dashboard:** every Supabase mutation is a call
into the dashboard backend, which holds `SUPABASE_SERVICE_ROLE_KEY` and
performs the write. Don't expose the service-role key in the dashboard
frontend bundle. The anon key isn't required for the current feature
set (the reader uses service-role too); reserve it for future
direct-read scenarios.
