import { describe, it, expect } from "vitest";
import { DEFAULT_BRANDING } from "../../data/default-branding";

const common = DEFAULT_BRANDING;
import {
  buildBrandRootStyle,
  fontStackToCssValue,
} from "../../data/common-helpers";
import { FONT_FAMILIES } from "../../data/fonts";
import {
  bodyStack,
  fontPresence,
  headingStack,
  resolvedFontStacks,
} from "../../data/fonts.server";

describe("DEFAULT_BRANDING (fallback from data/common.json)", () => {
  it("defines brand.colors with expected keys", () => {
    const colors = common.brand?.colors;
    expect(colors).toBeDefined();
    expect(colors?.accentColor1).toMatch(/^#/);
    expect(colors?.accentColor2).toMatch(/^#/);
    expect(colors?.backgroundColor).toMatch(/^#/);
    expect(colors?.backgroundColor2).toMatch(/^#/);
    expect(colors?.bodyColor).toMatch(/^#/);
  });

  it("defines strings for site metadata", () => {
    expect(common.strings?.siteTitle).toBeTruthy();
    expect(common.strings?.pageDescription).toBeTruthy();
  });

  it("buildBrandRootStyle includes each color token and rgb channels", () => {
    const css = buildBrandRootStyle(common as any);
    expect(css).toContain(":root");
    for (const key of Object.keys(common.brand!.colors)) {
      expect(css).toContain(`--${key}:`);
      expect(css).toContain(`--${key}-rgb:`);
    }
  });

  it("buildBrandRootStyle includes the resolved font CSS variables when stacks are passed", () => {
    const css = buildBrandRootStyle(common as any, resolvedFontStacks);
    for (const key of Object.keys(resolvedFontStacks)) {
      expect(css).toContain(`--${key}:`);
    }
  });

  it("buildBrandRootStyle omits font CSS variables when no stacks are passed (browser-safe default)", () => {
    const css = buildBrandRootStyle(common as any);
    expect(css).not.toContain("--bodyFont:");
    expect(css).not.toContain("--headingFont:");
  });

  it("fontStackToCssValue quotes family names with spaces", () => {
    expect(fontStackToCssValue(["Some Font", "sans-serif"])).toBe(
      '"Some Font", sans-serif',
    );
  });
});

describe("data/fonts.server.ts dynamic font detection", () => {
  it("always exposes the body font as the first entry of bodyStack", () => {
    expect(bodyStack[0]).toBe(FONT_FAMILIES.body);
    expect(bodyStack[bodyStack.length - 1]).toBe("sans-serif");
  });

  it("ships with bodyFont.woff2 present", () => {
    expect(fontPresence.body).toBe(true);
  });

  it("collapses heading stack to body stack when no heading font is uploaded", () => {
    if (!fontPresence.heading) {
      expect(headingStack).toEqual(bodyStack);
    } else {
      expect(headingStack[0]).toBe(FONT_FAMILIES.heading);
      expect(headingStack).toContain(FONT_FAMILIES.body);
    }
  });

  it("exposes a headingAlt alias for back-compat", () => {
    expect(resolvedFontStacks.headingAlt).toEqual(resolvedFontStacks.headingFont);
  });
});

describe("tailwind.config references CSS variables for brand colors", () => {
  it("maps each brand token to rgb(var(--token-rgb) / <alpha-value>)", async () => {
    const mod = await import("../../tailwind.config.ts");
    const tailwind = mod.default;
    const twColors = tailwind.theme?.extend?.colors as Record<string, string>;
    expect(twColors).toBeDefined();
    for (const key of Object.keys(common.brand!.colors)) {
      expect(twColors[key]).toContain(`var(--${key}-rgb)`);
    }
  });

  it("exposes the resolved font stacks under the same family keys", async () => {
    const mod = await import("../../tailwind.config.ts");
    const tailwind = mod.default;
    const twFonts = tailwind.theme?.extend?.fontFamily as Record<string, string[]>;
    expect(twFonts).toBeDefined();
    expect(twFonts.bodyFont).toEqual(resolvedFontStacks.bodyFont);
    expect(twFonts.headingFont).toEqual(resolvedFontStacks.headingFont);
    expect(twFonts.headingAlt).toEqual(resolvedFontStacks.headingAlt);
  });
});
