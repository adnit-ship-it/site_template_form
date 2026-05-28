import { config as loadDotenv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadDotenv({ path: ".env" });

const fail = (message) => {
  console.error(`[verify-db-branding] ${message}`);
  process.exit(1);
};

const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const orgId = process.env.NUXT_PUBLIC_ORG_ID?.trim();
const requireDbBrandingRaw = process.env.NUXT_PUBLIC_REQUIRE_DB_BRANDING?.trim();
const requireDbBranding =
  requireDbBrandingRaw === "1" ||
  requireDbBrandingRaw === "true" ||
  requireDbBrandingRaw === "TRUE";

if (!requireDbBranding) {
  console.log(
    "[verify-db-branding] skipped (set NUXT_PUBLIC_REQUIRE_DB_BRANDING=1 to enforce)",
  );
  process.exit(0);
}

if (!supabaseUrl) {
  fail("missing NUXT_PUBLIC_SUPABASE_URL");
}
if (!serviceRoleKey) {
  fail("missing SUPABASE_SERVICE_ROLE_KEY");
}
if (!orgId) {
  fail("missing NUXT_PUBLIC_ORG_ID");
}

let supabase;
try {
  supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
} catch {
  fail("failed to create Supabase client");
}

const { data, error } = await supabase
  .from("site_branding")
  .select("org_name, site_title, page_description, colors")
  .eq("org_id", orgId)
  .maybeSingle();

if (error) {
  fail(`Supabase query failed for org_id="${orgId}": ${error.message}`);
}

if (!data) {
  fail(`no site_branding row found for org_id="${orgId}"`);
}

if (!data.site_title?.trim()) {
  fail(`site_branding.site_title is empty for org_id="${orgId}"`);
}

if (!data.page_description?.trim()) {
  fail(`site_branding.page_description is empty for org_id="${orgId}"`);
}

if (!data.colors || typeof data.colors !== "object" || Object.keys(data.colors).length === 0) {
  fail(`site_branding.colors is empty for org_id="${orgId}"`);
}

console.log(`[verify-db-branding] OK for org_id="${orgId}"`);
