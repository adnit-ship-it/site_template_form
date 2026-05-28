import { describe, it, expect, vi } from "vitest";
import {
  normalizeGtmContainerId,
  parseEmbedAllowedOrigins,
} from "../../utils/envSanitize";
import {
  diagnoseSupabaseEnv,
  isValidSupabaseHttpUrl,
} from "../../server/utils/supabaseConfig";

describe("envSanitize", () => {
  it("accepts valid GTM ids", () => {
    expect(normalizeGtmContainerId("GTM-ABC123")).toBe("GTM-ABC123");
  });

  it("rejects JWT-like GTM values", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(normalizeGtmContainerId("eyJhbGciOiJIUzI1NiJ9")).toBe("");
  });

  it("parses https embed origins and skips JWTs", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const origins = parseEmbedAllowedOrigins(
      "https://partner.example.com,eyJfake,https://other.test",
    );
    expect(origins).toEqual(["https://partner.example.com", "https://other.test"]);
  });
});

describe("supabaseConfig", () => {
  it("validates supabase project URLs", () => {
    expect(isValidSupabaseHttpUrl("https://abc.supabase.co")).toBe(true);
    expect(isValidSupabaseHttpUrl("abc.supabase.co")).toBe(false);
    expect(isValidSupabaseHttpUrl("eyJhbGciOi")).toBe(false);
  });

  it("diagnoses missing service role key", () => {
    const d = diagnoseSupabaseEnv("https://abc.supabase.co", "");
    expect(d.hasUrl).toBe(true);
    expect(d.hasServiceRoleKey).toBe(false);
  });
});
