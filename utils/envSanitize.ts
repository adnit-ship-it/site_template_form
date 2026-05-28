/**
 * Guards build-time env parsing so secrets (JWTs) are not injected into GTM or CSP.
 */

/** GTM container ids look like GTM-XXXXXXX */
export function normalizeGtmContainerId(raw: string | undefined): string {
  const id = (raw ?? "").trim();
  if (!id) return "";
  if (/^GTM-[A-Z0-9]+$/i.test(id)) return id;
  if (id.startsWith("eyJ")) {
    console.warn(
      "[env] GTM_CONTAINER_ID looks like a JWT/API key — use a GTM id (GTM-XXXX) or leave empty. GTM script disabled.",
    );
    return "";
  }
  console.warn(
    `[env] GTM_CONTAINER_ID "${id.slice(0, 12)}…" is not a valid GTM- container id — GTM disabled.`,
  );
  return "";
}

/** CSP frame-ancestors only accepts http(s) origins, not API keys. */
export function parseEmbedAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((entry) => {
      if (!entry) return false;
      if (entry.startsWith("eyJ")) {
        console.warn(
          "[env] NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS contains a JWT-like value — skipped (use https:// origins only).",
        );
        return false;
      }
      try {
        const u = new URL(entry);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        console.warn(
          `[env] NUXT_PUBLIC_EMBED_ALLOWED_ORIGINS entry is not a valid URL — skipped: "${entry.slice(0, 40)}…"`,
        );
        return false;
      }
    });
}
