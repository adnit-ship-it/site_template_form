import { getCurrentOrgId } from "~/server/utils/orgId";

/**
 * Webhook target for Supabase Database Webhooks. When the dashboard updates
 * `site_config`, `announcement`, or `site_branding`, Supabase POSTs here so we can blow away
 * the cached value held by `/api/runtime-config.get.ts` — without waiting
 * for the 60s TTL to lapse.
 *
 * Setup walkthrough lives in `docs/SUPABASE_WEBHOOKS.md`. Until the webhook
 * is configured on the Supabase side, this endpoint is dormant; runtime
 * config refreshes via TTL only.
 *
 * Auth: the Supabase webhook must include `x-webhook-secret: <secret>` in
 * its headers, where `<secret>` matches `SUPABASE_WEBHOOK_SECRET` in env.
 * Anything else returns 401.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const expectedSecret = (config.supabaseWebhookSecret as string | undefined)?.trim();

  if (!expectedSecret) {
    // Endpoint exists but secret not configured — refuse rather than let
    // anyone in the world bust the cache.
    throw createError({
      statusCode: 503,
      statusMessage:
        "Webhook endpoint not configured (SUPABASE_WEBHOOK_SECRET not set).",
    });
  }

  const providedSecret = getHeader(event, "x-webhook-secret");
  if (providedSecret !== expectedSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid webhook secret.",
    });
  }

  // The Nitro cache key matches what `runtime-config.get.ts` uses.
  const orgId = getCurrentOrgId(event) ?? "anon";
  const cacheKey = `nitro:functions:runtime-config:runtime-config:${orgId}.json`;

  try {
    const storage = useStorage("cache");
    await storage.removeItem(cacheKey);
  } catch (err) {
    console.error("[runtime-config invalidate] cache removeItem failed:", err);
    // Don't fail the webhook — Supabase will retry on 5xx and the TTL will
    // eventually expire anyway. Better to acknowledge.
  }

  return { ok: true, invalidated: cacheKey };
});
