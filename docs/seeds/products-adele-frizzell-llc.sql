-- Seed: products + categories for org_id = 'adele-frizzell-llc'
--
-- Inserts the entire current contents of data/intake-form/productsList.json
-- into the `categories` and `products` tables under
-- org_id = 'adele-frizzell-llc'.
--
-- Run this in the Supabase SQL editor AFTER creating the `categories` and
-- `products` tables (see docs/SUPABASE_SCHEMA.md).
--
-- Properties:
--   * Transactional: wrapped in BEGIN/COMMIT, so a failure rolls back.
--   * Idempotent:    every INSERT uses ON CONFLICT ... DO UPDATE, so re-running
--                    the file re-syncs rows from the JSON instead of erroring.
--   * Self-contained: also upserts a `site_config` row so the FK from
--                    `categories.org_id` resolves on a fresh project.

begin;

------------------------------------------------------------------------------
-- 1. site_config row (so the FK target exists)
------------------------------------------------------------------------------

insert into site_config (org_id)
values ('adele-frizzell-llc')
on conflict (org_id) do nothing;

------------------------------------------------------------------------------
-- 2. categories (7 rows)
------------------------------------------------------------------------------

insert into categories (org_id, id, name, images, availability) values
  ('adele-frizzell-llc', 'weight-loss',   'Weight Loss',   '{"mainImg":"/assets/images/products/weight-loss/cover.png"}'::jsonb, 'in_stock'),
  ('adele-frizzell-llc', 'hrt',           'HRT',           '{"mainImg":"/assets/images/products/weight-loss/cover.png"}'::jsonb, 'out_of_stock'),
  ('adele-frizzell-llc', 'trt',           'TRT',           '{"mainImg":"/assets/images/products/weight-loss/cover.png"}'::jsonb, 'out_of_stock'),
  ('adele-frizzell-llc', 'wellness',      'Wellness',      '{"mainImg":"/assets/images/products/weight-loss/cover.png"}'::jsonb, 'out_of_stock'),
  ('adele-frizzell-llc', 'sexual-health', 'Sexual Health', '{"mainImg":"/assets/images/products/weight-loss/cover.png"}'::jsonb, 'out_of_stock'),
  ('adele-frizzell-llc', 'skin-care',     'Skin Care',     '{"mainImg":"/assets/images/products/semaglutide-injection.png"}'::jsonb, 'in_stock'),
  ('adele-frizzell-llc', 'hair-loss',     'Hair Loss',     '{"mainImg":"/assets/images/products/semaglutide-injection.png"}'::jsonb, 'in_stock')
on conflict (org_id, id) do update set
  name         = excluded.name,
  images       = excluded.images,
  availability = excluded.availability;

------------------------------------------------------------------------------
-- 3. products (28 rows)
--
-- Per-product INSERT ... ON CONFLICT (org_id, id) DO UPDATE.
-- The `variations` JSONB array mirrors the JSON file exactly.
------------------------------------------------------------------------------

-- 3a. weight-loss (4 products)

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
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
    {"duration":"monthly","id":"1fb1f23a-a77a-40a5-b502-6685e9a1a887","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":269,"refillPrice":299},
    {"duration":"threeMonthly","id":"f3d17b02-4956-4739-8967-a0a5b4f51d53","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0},
    {"duration":"sixMonthly","id":"3c890ef9-bc38-4368-9309-0ba02b19406b","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0},
    {"duration":"yearly","id":"25bf11ff-7d47-49cd-bc27-a93bf06a8d0d","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0}
  ]'::jsonb,
  'in_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'compounded-tirzepatide',
  'weight-loss',
  'Compounded Tirzepatide',
  'Compounded Tirzepatide',
  'weight-loss',
  'Faster results. Dual-action support.',
  'injections',
  '{"mainImg":"/assets/images/products/tirzepatide-injection.png"}'::jsonb,
  'Fastest Results',
  'Tirzepatide is a dual-action GLP-1 and GIP therapy designed for individuals who benefit from a more advanced formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"c08d0c7e-9cd8-4130-9742-338515627ad9","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":359,"refillPrice":399},
    {"duration":"threeMonthly","id":"78ebfde4-07b7-4201-ab33-42d3cc43d5e4","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0},
    {"duration":"sixMonthly","id":"dde5cb80-60ac-4a77-953a-b414446bd06e","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0},
    {"duration":"yearly","id":"0bf1f53a-a3ea-4cf9-bc8a-8d6e1ab276bf","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0}
  ]'::jsonb,
  'in_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'compounded-semaglutide-oral',
  'weight-loss',
  'Compounded Semaglutide Oral Capsules',
  'Compounded Semaglutide Oral Capsules',
  'weight-loss',
  'Proven, effective, more affordable.',
  'tablets',
  '{"mainImg":"/assets/images/products/semaglutide-odt.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"111fbbd4-c22f-41d1-b4c3-e1bb72aa5ac9","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":299,"refillPrice":349},
    {"duration":"threeMonthly","id":"cb209c7d-178c-4046-a7a4-528f4378b2f1","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0},
    {"duration":"sixMonthly","id":"d8a7dd53-e9fb-4c5f-a2dc-c9fa5db24e64","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0},
    {"duration":"yearly","id":"cd9752db-ce62-4683-a240-55a80c5b7ec4","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0}
  ]'::jsonb,
  'in_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'compounded-tirzepatide-oral',
  'weight-loss',
  'Compounded Tirzepatide Oral Capsules',
  'Compounded Tirzepatide Oral Capsules',
  'weight-loss',
  'Faster results. Dual-action support.',
  'tablets',
  '{"mainImg":"/assets/images/products/tirzepatide-odt.png"}'::jsonb,
  'Fastest Results',
  'Tirzepatide is a dual-action GLP-1 and GIP therapy designed for individuals who benefit from a more advanced formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"824bb2ae-b0a4-4ca4-b205-65e5338f396c","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":349,"refillPrice":399},
    {"duration":"threeMonthly","id":"55949210-9527-4260-ba6b-d38bf71d8e8d","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0},
    {"duration":"sixMonthly","id":"4d0d8bc8-f920-4ddf-9aa4-f5e23c7c465b","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0},
    {"duration":"yearly","id":"361777f2-2657-4e02-a12d-01caa8f29370","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":0}
  ]'::jsonb,
  'in_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

-- 3b. hrt (4 products)

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'estradiol-tablets',
  'hrt',
  'Estradiol Tablets',
  'Estradiol Tablets',
  'womens-hrt',
  'Proven, effective, more affordable.',
  'tablets',
  '{"mainImg":"/assets/images/products/estradiol-clear-olive-capsule.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"0de12f0e-e4f7-49d4-91f9-87e9d408799d","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":199}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'estradiol-patch',
  'hrt',
  'Estradiol Patch',
  'Estradiol Patch',
  'womens-hrt',
  'Faster results. Dual-action support.',
  'patch',
  '{"mainImg":"/assets/images/products/estradiol-patch.png"}'::jsonb,
  'Fastest Results',
  'Tirzepatide is a dual-action GLP-1 and GIP therapy designed for individuals who benefit from a more advanced formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"bb4f2aef-57b2-4e3e-bc6a-b733c7575884","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":269}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'estradiol-cream',
  'hrt',
  'Estradiol Cream',
  'Estradiol Cream',
  'womens-hrt',
  'Proven, effective, more affordable.',
  'cream',
  '{"mainImg":"/assets/images/products/estradiol-cream.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"ec5e778e-1e5b-4719-a855-5efb8ba5080f","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":269,"refillPrice":299}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'estriol-vaginal-cream',
  'hrt',
  'Estriol Vaginal Cream',
  'Estriol Vaginal Cream',
  'womens-hrt',
  'Faster results. Dual-action support.',
  'cream',
  '{"mainImg":"/assets/images/products/estriol-vaginal-cream.png"}'::jsonb,
  'Fastest Results',
  'Tirzepatide is a dual-action GLP-1 and GIP therapy designed for individuals who benefit from a more advanced formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"06a317f9-0814-4425-9b33-6369f072ab89","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":249}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

-- 3c. trt (4 products)

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'testosterone-cypionate-mct-oil-injection',
  'trt',
  'Testosterone Cypionate (MCT Oil) Injection',
  'Testosterone Cypionate (MCT Oil) Injection',
  'mens-hrt',
  'Proven, effective, more affordable.',
  'drops',
  '{"mainImg":"/assets/images/products/testosterone-cypionate.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"516edf81-8e1c-4a09-9025-758bcb556fef","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":179},
    {"duration":"yearly","id":"5538f29a-4c57-4d62-a7e7-3b8e5b01b3c8","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":1500}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

-- Note: this product's `monthly` and `threeMonthly` variations share the same
-- `id` ("04bedd32-...") in the source JSON. Preserved as-is in JSONB.
insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'enclomiphene-citrate-dhea-boron-pregenolone-odt',
  'trt',
  'Enclomiphene Citrate / DHEA / Boron / Pregnenolone ODT',
  'Enclomiphene Citrate / DHEA / Boron / Pregnenolone ODT',
  'mens-hrt',
  'Proven, effective, more affordable.',
  'tablets',
  '{"mainImg":"/assets/images/products/enclomiphene-citrate.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"04bedd32-ef96-48e3-af81-3011552598b3","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":199},
    {"duration":"threeMonthly","id":"04bedd32-ef96-48e3-af81-3011552598b3","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":597},
    {"duration":"sixMonthly","id":"dbfc4490-124e-4fcf-84ed-94eb8a3dde71","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":899},
    {"duration":"yearly","id":"e4674a16-f32c-42b0-b8ec-02f09bab6794","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":1669}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'kyzatrex',
  'trt',
  'KYZATREX®',
  'KYZATREX®',
  'mens-hrt',
  'Faster results. Dual-action support.',
  'drops',
  '{"mainImg":"/assets/images/products/kyzatrex.png"}'::jsonb,
  'Fastest Results',
  'Tirzepatide is a dual-action GLP-1 and GIP therapy designed for individuals who benefit from a more advanced formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"cf2c59db-338b-47ac-86b2-1d82553f2863","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":219},
    {"duration":"twoMonthly","id":"9252d1ed-5baa-4876-9b02-b3897243aa54","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":349},
    {"duration":"fourMonthly","id":"1a86c593-761b-4dc8-bfb9-6007e97d9624","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":499}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'gonadorelin-troche',
  'trt',
  'Gonadorelin Troche',
  'Gonadorelin Troche',
  'mens-hrt',
  'Proven, effective, more affordable.',
  'tablets',
  '{"mainImg":"/assets/images/products/gonadorelin-troche.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"5a8c8fc8-a294-4e9e-b346-c0d81e523041","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":35},
    {"duration":"threeMonthly","id":"e2612d0c-a103-4652-80a8-b8b251f9ca65","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":105},
    {"duration":"sixMonthly","id":"86c6cbc0-00bf-4039-81f5-c3ac4124a6a0","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":210},
    {"duration":"yearly","id":"3a1a29f0-6766-48da-81b8-af781026a2c0","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":420}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

-- 3d. wellness (8 products)

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'sermorelin-injection',
  'wellness',
  'Sermorelin Injection',
  'Sermorelin Injection',
  'sermorelin',
  'Proven, effective, more affordable.',
  'drops',
  '{"mainImg":"/assets/images/products/sermorelin-injection.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"9e2db336-a3c1-4559-84de-e623a8791c8b","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":249,"refillPrice":299},
    {"duration":"threeMonthly","id":"732a5768-31d5-4ffd-bb11-c601463f2d00","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":597},
    {"duration":"sixMonthly","id":"1c0c2d1e-ac8b-483c-86cd-044ba9a91d53","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":997},
    {"duration":"yearly","id":"e3819a02-3108-4c5a-90fc-4d9746ae190c","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":1897}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'sermorelin-odt',
  'wellness',
  'Sermorelin ODT',
  'Sermorelin ODT',
  'sermorelin',
  'Faster results. Dual-action support.',
  'injections',
  '{"mainImg":"/assets/images/products/sermorelin-odt.png"}'::jsonb,
  'Fastest Results',
  'Tirzepatide is a dual-action GLP-1 and GIP therapy designed for individuals who benefit from a more advanced formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"d1e4fe0b-18d5-444f-956c-831a2b2959df","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":249,"refillPrice":399},
    {"duration":"threeMonthly","id":"05e1ad1c-19b3-49e8-8ac7-9b46c33d0941","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":597},
    {"duration":"sixMonthly","id":"f8c51645-a584-4a0c-9b58-efe8200d5a2d","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":997},
    {"duration":"yearly","id":"54c74959-c263-40ef-a266-0a170505a8d4","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":1897}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'nad-injection',
  'wellness',
  'NAD+ Injection',
  'NAD+ Injection',
  'nad-plus',
  'Proven, effective, more affordable.',
  'drops',
  '{"mainImg":"/assets/images/products/nad-injection.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"75dfa03b-e2da-4a06-a5da-0a97ff445269","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":249,"refillPrice":299},
    {"duration":"threeMonthly","id":"9868348d-fe7a-404c-97a3-90e1ec50380f","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":597},
    {"duration":"sixMonthly","id":"70f754fb-c98b-4e84-9cee-bc94ca60c8c3","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":997},
    {"duration":"yearly","id":"73c0118d-1746-4e6b-8371-6803a7671283","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":1897}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'nad-nasal-spray',
  'wellness',
  'NAD+ Nasal Spray',
  'NAD+ Nasal Spray',
  'nad-plus',
  'Proven, effective, more affordable.',
  'spray',
  '{"mainImg":"/assets/images/products/nad-nasal-spray.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"5888e063-e640-4b51-9de3-a19d368dfa5e","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":249,"refillPrice":299},
    {"duration":"threeMonthly","id":"ff9774a6-6a39-4738-8bdb-cfeb345eb772","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":597},
    {"duration":"sixMonthly","id":"25a7e073-b6fa-49c1-a780-11580ade83da","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":997},
    {"duration":"yearly","id":"c16d9806-b4a3-489d-adbf-e4d9fa131510","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":1897}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'nad-flex-dose-tablet',
  'wellness',
  'NAD+ Flex Dose Tablet',
  'NAD+ Flex Dose Tablet',
  'nad-plus',
  'Proven, effective, more affordable.',
  'tablets',
  '{"mainImg":"/assets/images/products/nad-flex-dose-tablet.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"f98fb8dd-6f9e-4853-85c5-799da582e4ea","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":249,"refillPrice":299},
    {"duration":"threeMonthly","id":"76ac4020-3a1d-44fc-b867-843dfdfc8e88","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":597},
    {"duration":"sixMonthly","id":"bf04b023-47f3-4cec-8fb0-f516465d2e16","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":997},
    {"duration":"yearly","id":"a1176e3c-ea59-44ee-8752-8b0545640f1d","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":1897}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'methylene-blue',
  'wellness',
  'Methylene Blue',
  'Methylene Blue',
  'methylene-blue',
  'Proven, effective, more affordable.',
  'cream',
  '{"mainImg":"/assets/images/products/methylene-blue.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"144d41c4-1bb0-412c-b2f4-0b11f3862e4d","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":99}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'glutathione-injections',
  'wellness',
  'Glutathione Injections',
  'Glutathione Injections',
  'glutathione',
  'Proven, effective, more affordable.',
  'drops',
  '{"mainImg":"/assets/images/products/glutathione-injections.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"9283a7c5-6ace-4584-925e-fd60ecbf4fea","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":109}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'mic-b12-injection',
  'wellness',
  'MIC B12 Injection',
  'MIC B12 Injection',
  'vitamin-b12',
  'Proven, effective, more affordable.',
  'drops',
  '{"mainImg":"/assets/images/products/mic-b12-injection.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"149aeb06-0186-4903-acfd-8eb3a7ea36c3","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":149}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

-- 3e. sexual-health (6 products)

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'sildenafil-pycnogenol-6-doses',
  'sexual-health',
  'Sildenafil/Pycnogenol (6 doses)',
  'Sildenafil/Pycnogenol (6 doses)',
  'sexual-health',
  'Proven, effective, more affordable.',
  'drops',
  '{"mainImg":"/assets/images/products/sildenafil-pycnogenol.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"40cc35d8-1817-4516-a73d-43aecbe9037c","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":60}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'tadalafil-pycnogenol-6-doses',
  'sexual-health',
  'Tadalafil/Pycnogenol (6 doses)',
  'Tadalafil/Pycnogenol (6 doses)',
  'sexual-health',
  'Faster results. Dual-action support.',
  'drops',
  '{"mainImg":"/assets/images/products/tadalafil-pycnogenol.png"}'::jsonb,
  'Fastest Results',
  'Tirzepatide is a dual-action GLP-1 and GIP therapy designed for individuals who benefit from a more advanced formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"d7c6d7b5-65c0-4268-be46-204ee39687c5","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":60}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'tadalafil-sildenafil-6-doses',
  'sexual-health',
  'Tadalafil/Sildenafil (6 Doses)',
  'Tadalafil/Sildenafil (6 Doses)',
  'sexual-health',
  'Proven, effective, more affordable.',
  'tablets',
  '{"mainImg":"/assets/images/products/tadalafil-sildenafil.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"088b8982-26dc-47c7-afa1-505fe29e8c32","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":96}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'tadalafil',
  'sexual-health',
  'Tadalafil',
  'Tadalafil',
  'sexual-health',
  'Proven, effective, more affordable.',
  'tablets',
  '{"mainImg":"/assets/images/products/tadalafil.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"99fb6862-4b08-41a0-abec-d510e33b17d4","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":115}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'vardenafil-10-doses',
  'sexual-health',
  'Vardenafil (10 doses)',
  'Vardenafil (10 doses)',
  'sexual-health',
  'Proven, effective, more affordable.',
  'tablets',
  '{"mainImg":"/assets/images/products/vardenafil.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"784fedd4-d042-4470-9908-a0e65697d81c","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":149}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'bremelanotide-injection',
  'sexual-health',
  'Bremelanotide (injection)',
  'Bremelanotide (injection)',
  'sexual-health',
  'Proven, effective, more affordable.',
  'injections',
  '{"mainImg":"/assets/images/products/bremelanotide-injection.png"}'::jsonb,
  'Most Affordable',
  'THE GLP-1 Injections are customized GLP-1 therapy designed for individuals who benefit from a formulation aligned with their specific health goals.',
  '[
    {"duration":"monthly","id":"9c71774a-cb77-4978-a5c4-57dd2f638d88","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":199}
  ]'::jsonb,
  'out_of_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

-- 3f. skin-care (1 product)

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'skin-care-test',
  'skin-care',
  'Skin Care Test Product',
  'Skin Care Test Product',
  'skin-care',
  'Dummy product wired to the skin-care quiz for local testing.',
  'tablets',
  '{"mainImg":"/assets/images/products/semaglutide-injection.png"}'::jsonb,
  'Test Only',
  'Local-test fixture: selecting this product loads the skin-care intake form.',
  '[
    {"duration":"monthly","id":"11111111-skin-4aaa-8aaa-aaaaaaaaaaaa","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":99}
  ]'::jsonb,
  'in_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

-- 3g. hair-loss (1 product)

insert into products (
  org_id, id, category_id, name, selection_name, quiz_id, intro, type,
  images, tag, description, variations, availability
) values (
  'adele-frizzell-llc',
  'hair-loss-test',
  'hair-loss',
  'Hair Loss Test Product',
  'Hair Loss Test Product',
  'hair-loss',
  'Dummy product wired to the hair-loss quiz for local testing.',
  'tablets',
  '{"mainImg":"/assets/images/products/semaglutide-injection.png"}'::jsonb,
  'Test Only',
  'Local-test fixture: selecting this product loads the hair-loss intake form.',
  '[
    {"duration":"monthly","id":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","bundleId":"22222222-hair-4bbb-8bbb-bbbbbbbbbbbb","price":99}
  ]'::jsonb,
  'in_stock'
)
on conflict (org_id, id) do update set
  category_id    = excluded.category_id,
  name           = excluded.name,
  selection_name = excluded.selection_name,
  quiz_id        = excluded.quiz_id,
  intro          = excluded.intro,
  type           = excluded.type,
  images         = excluded.images,
  tag            = excluded.tag,
  description    = excluded.description,
  variations     = excluded.variations,
  availability   = excluded.availability;

------------------------------------------------------------------------------
-- 4. Verify (uncomment to run after commit)
------------------------------------------------------------------------------

-- select count(*) as category_count from categories where org_id = 'adele-frizzell-llc'; -- expect 7
-- select count(*) as product_count  from products   where org_id = 'adele-frizzell-llc'; -- expect 28

commit;
