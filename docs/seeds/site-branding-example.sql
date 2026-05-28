-- Example: site_branding for org_id = 'adele-frizzell-llc'
-- Run after site_config row exists for the org.

insert into site_branding (
  org_id,
  org_name,
  site_title,
  page_description,
  colors,
  default_quiz_id
) values (
  'adele-frizzell-llc',
  'Some Client',
  'Some Client - Discover a better you with GLP-1s.',
  'Some Client is made personalized for you and your weight loss journey.',
  '{
    "backgroundColor": "#F6F6F6",
    "bodyColor": "#000000",
    "accentColor1": "#112641",
    "accentColor2": "#112641",
    "backgroundColor2": "#F6F6F6"
  }'::jsonb,
  'weight-loss'
)
on conflict (org_id) do update set
  org_name = excluded.org_name,
  site_title = excluded.site_title,
  page_description = excluded.page_description,
  colors = excluded.colors,
  default_quiz_id = excluded.default_quiz_id;
