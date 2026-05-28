# Supabase Database Webhooks → Instant Publish

The reader caches `/api/runtime-config` responses in Nitro storage for 60s.
That TTL is the safety net — if you do nothing, dashboard edits show up
within a minute of being saved.

For **instant publish** (a dashboard edit appears on the next page request,
not next-minute), configure a Supabase Database Webhook that POSTs to this
app's invalidation endpoint on every `UPDATE` / `INSERT` to `site_config`
`announcement`, or `site_branding`. The endpoint blows away the cache key; the next request
re-fetches from Supabase.

---

## Endpoint

```
POST  https://<your-deployment>/api/runtime-config/invalidate
Header:  x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>
```

- Source: [server/api/runtime-config/invalidate.post.ts](../server/api/runtime-config/invalidate.post.ts)
- Verifies the `x-webhook-secret` header against the `SUPABASE_WEBHOOK_SECRET`
  env var. Mismatched secret → `401`. Missing env var → `503` (refuses to be
  publicly invalidatable).
- Returns `200 { ok: true, invalidated: '<key>' }` on success.

---

## One-time setup

### 1. Choose a secret

Pick a long random string (e.g. `openssl rand -hex 32`). Put it in two places:

- The Vercel env vars for this deployment:
  ```
  SUPABASE_WEBHOOK_SECRET=<your-secret>
  ```
- The Supabase Database Webhook config (next section).

### 2. Create the webhook in Supabase

In the Supabase Studio:

1. Go to **Database → Webhooks → Create a new hook**.
2. **Name:** `invalidate-runtime-config-site_config` (one webhook per table)
3. **Table:** `site_config`
4. **Events:** ✅ INSERT, ✅ UPDATE, ✅ DELETE
5. **Type:** `HTTP Request`
6. **HTTP method:** `POST`
7. **URL:** `https://<your-deployment>/api/runtime-config/invalidate`
8. **HTTP headers:**
   - `x-webhook-secret`: `<your-secret>`
   - `Content-Type`: `application/json`
9. Save.

Repeat for the `announcement` and `site_branding` tables (same URL + headers,
different "Table" selection). Name them
`invalidate-runtime-config-announcement` and
`invalidate-runtime-config-site_branding`.

### 3. Test it

In Supabase Studio, edit any field on either table and save. Check Vercel
logs for this app — you should see a `200` log entry for
`/api/runtime-config/invalidate` immediately. Reload any page; the change is
visible.

If you see `401`, the secret doesn't match. If you see `503`, the env var
isn't set on the deployment. If you see no log at all, the webhook didn't
fire — re-check the webhook URL and event types.

---

## Why per-table (vs. one webhook on multiple tables)

Supabase Database Webhooks bind to exactly one table. Two webhooks, one for
each runtime-config table, is the supported pattern. Both hit the same
endpoint and both invalidate the same Nitro cache key — the endpoint doesn't
care which table changed.

When Phase 2 adds `product_categories` / `products` / `product_variations`,
you'll add three more webhooks pointing at a sibling endpoint (e.g.
`/api/products/invalidate`). Same pattern.

---

## Secret rotation

To rotate `SUPABASE_WEBHOOK_SECRET`:

1. Set the new value in Vercel env vars.
2. **Before** redeploying, update each Supabase webhook's `x-webhook-secret`
   header to the new value.
3. Redeploy. Webhooks call with the new secret, the deployment verifies
   against the new value. No downtime.

(Reverse order would briefly cause 401s during the window between deploy
and Supabase header update.)

---

## What happens if the webhook fails

The endpoint is best-effort. If invalidation fails (network, Vercel cold
start, anything), the cache simply lives out its 60s TTL and self-refreshes.
No data loss, no inconsistent state — just a delayed publish.

Supabase retries failing webhooks automatically (default exponential backoff,
configurable in the webhook settings).
