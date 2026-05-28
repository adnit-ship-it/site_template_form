/**
 * Validates Supabase env before createClient (avoids 500s from invalid URLs).
 */

export function isValidSupabaseHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    // Project URL is typically *.supabase.co (or custom domain).
    return /\.supabase\.co$/i.test(parsed.hostname) || parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

export interface SupabaseEnvDiagnostic {
  hasUrl: boolean;
  hasServiceRoleKey: boolean;
  urlLooksValid: boolean;
  urlLooksLikeJwt: boolean;
  keyLooksLikeJwt: boolean;
  urlPreview: string;
}

export function diagnoseSupabaseEnv(
  url?: string,
  serviceRoleKey?: string,
): SupabaseEnvDiagnostic {
  const u = url?.trim() ?? "";
  const k = serviceRoleKey?.trim() ?? "";
  return {
    hasUrl: Boolean(u),
    hasServiceRoleKey: Boolean(k),
    urlLooksValid: u ? isValidSupabaseHttpUrl(u) : false,
    urlLooksLikeJwt: u.startsWith("eyJ"),
    keyLooksLikeJwt: k.startsWith("eyJ"),
    urlPreview: u ? `${u.slice(0, 40)}${u.length > 40 ? "…" : ""}` : "(empty)",
  };
}

export function formatSupabaseEnvHint(diag: SupabaseEnvDiagnostic): string {
  if (!diag.hasUrl) {
    return 'set NUXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co';
  }
  if (diag.urlLooksLikeJwt) {
    return "NUXT_PUBLIC_SUPABASE_URL looks like a JWT — use the Project URL from Supabase → Settings → API";
  }
  if (!diag.urlLooksValid) {
    return `NUXT_PUBLIC_SUPABASE_URL must be https://<ref>.supabase.co (got: ${diag.urlPreview})`;
  }
  if (!diag.hasServiceRoleKey) {
    return "set SUPABASE_SERVICE_ROLE_KEY (service_role secret from Supabase → API — not the same as SUPABASE_ANON_KEY)";
  }
  return "check Supabase env vars";
}
