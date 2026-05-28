import { describe, it, expect } from "vitest";
import { DEFAULT_BRANDING } from "../../data/default-branding";
import {
  DEFAULT_RUNTIME_CONFIG,
  type AnnouncementConfig,
  type RuntimeConfigDB,
  type SiteConfig,
} from "../../types/runtime-config";

describe("DEFAULT_RUNTIME_CONFIG", () => {
  it("exposes the expected top-level shape", () => {
    expect(DEFAULT_RUNTIME_CONFIG).toHaveProperty("siteConfig");
    expect(DEFAULT_RUNTIME_CONFIG).toHaveProperty("announcement");
    expect(DEFAULT_RUNTIME_CONFIG).toHaveProperty("branding");
  });

  it("ships safe defaults matching pre-Supabase behavior so the app still works without DB", () => {
    expect(DEFAULT_RUNTIME_CONFIG.siteConfig.bnplActivated).toBe(true);
    expect(DEFAULT_RUNTIME_CONFIG.siteConfig.useNewAPI).toBe(true);
    expect(DEFAULT_RUNTIME_CONFIG.siteConfig.useStripe).toBe(true);
    expect(DEFAULT_RUNTIME_CONFIG.siteConfig.homeUrl).toMatch(/^https?:\/\//);
    expect(DEFAULT_RUNTIME_CONFIG.announcement.enabled).toBe(false);
    expect(DEFAULT_RUNTIME_CONFIG.siteConfig.defaultQuizIdOverride).toBeNull();
  });

  it("branding defaults mirror DEFAULT_BRANDING", () => {
    expect(DEFAULT_RUNTIME_CONFIG.branding).toEqual(DEFAULT_BRANDING);
    expect(DEFAULT_RUNTIME_CONFIG.branding.brand?.colors?.accentColor1).toMatch(/^#/);
  });

  it("siteConfig has every SiteConfig field populated (no undefineds)", () => {
    const keys: (keyof SiteConfig)[] = [
      "bnplActivated",
      "homeUrl",
      "useNewAPI",
      "useStripe",
      "everflowBaseUrl",
      "everflowOfferId",
      "everflowEventIds",
      "defaultQuizIdOverride",
    ];
    for (const k of keys) {
      expect(DEFAULT_RUNTIME_CONFIG.siteConfig[k]).not.toBeUndefined();
    }
  });

  it("everflowEventIds default is an empty array", () => {
    expect(Array.isArray(DEFAULT_RUNTIME_CONFIG.siteConfig.everflowEventIds)).toBe(true);
    expect(DEFAULT_RUNTIME_CONFIG.siteConfig.everflowEventIds).toHaveLength(0);
  });

  it("announcement has every AnnouncementConfig field populated (no undefineds)", () => {
    const keys: (keyof AnnouncementConfig)[] = [
      "enabled",
      "text",
      "backgroundColor",
      "textColor",
    ];
    for (const k of keys) {
      expect(DEFAULT_RUNTIME_CONFIG.announcement[k]).not.toBeUndefined();
    }
  });

  it("is type-compatible with RuntimeConfigDB", () => {
    const cfg: RuntimeConfigDB = DEFAULT_RUNTIME_CONFIG;
    expect(cfg).toBeTruthy();
  });
});
