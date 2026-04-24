import { describe, it, expect } from "vitest";
import common from "../../data/common.json";
import {
  buildBrandRootStyle,
  fontStackToCssValue,
} from "../../data/common-helpers";

describe("data/common.json brand tokens", () => {
  it("defines brand.colors with expected keys", () => {
    const colors = common.brand?.colors;
    expect(colors).toBeDefined();
    expect(colors?.accentColor1).toMatch(/^#/);
    expect(colors?.accentColor2).toMatch(/^#/);
    expect(colors?.backgroundColor).toMatch(/^#/);
    expect(colors?.backgroundColor2).toMatch(/^#/);
    expect(colors?.bodyColor).toMatch(/^#/);
  });

  it("defines fontStacks as non-empty string arrays", () => {
    const fs = common.brand?.fontStacks;
    expect(fs).toBeDefined();
    for (const [name, stack] of Object.entries(fs!)) {
      expect(Array.isArray(stack), name).toBe(true);
      expect((stack as string[]).length).toBeGreaterThan(0);
    }
  });

  it("defines strings for site metadata", () => {
    expect(common.strings?.siteTitle).toBeTruthy();
    expect(common.strings?.pageDescription).toBeTruthy();
  });

  it("buildBrandRootStyle includes each color and font token", () => {
    const css = buildBrandRootStyle(common as any);
    expect(css).toContain(":root");
    for (const key of Object.keys(common.brand!.colors)) {
      expect(css).toContain(`--${key}:`);
    }
    for (const key of Object.keys(common.brand!.fontStacks!)) {
      expect(css).toContain(`--${key}:`);
    }
  });

  it("fontStackToCssValue quotes family names with spaces", () => {
    expect(fontStackToCssValue(["Times New Roman", "sans-serif"])).toBe(
      '"Times New Roman", sans-serif',
    );
  });
});

describe("tailwind.config mirrors common brand colors (build-time)", () => {
  it("re-exports the same hex from tailwind theme", async () => {
    const mod = await import("../../tailwind.config.ts");
    const tailwind = mod.default;
    const twColors = tailwind.theme?.extend?.colors as Record<string, string>;
    expect(twColors).toBeDefined();
    for (const [k, v] of Object.entries(common.brand!.colors)) {
      expect(twColors[k], `tailwind theme.extend.colors.${k}`).toBe(v);
    }
  });
});
