/**
 * Browser-safe brand helpers. MUST NOT import anything that uses Node APIs
 * (e.g. `node:fs`) — this file is pulled into the client bundle through
 * `composables/useCommon.ts` and the brand-tokens plugin.
 *
 * If you need the *resolved* font stacks (file-system aware), import from
 * `data/fonts.server.ts` from a server-only context (build, SSR plugin, tests).
 */

/** Shape of site branding (`site_branding` table / `useCommon()`). */
export interface CommonData {
  brand?: {
    orgName: string;
    colors: Record<string, string>;
    /**
     * Font stacks are NOT stored in common.json — they're derived at build
     * time from files in `assets/fonts/` (see `data/fonts.server.ts`). The
     * `fonts` block here is purely informational metadata about the convention.
     */
    fonts?: {
      bodyFile: string;
      headingFile: string;
    };
  };
  strings?: {
    siteTitle?: string;
    pageDescription?: string;
  };
  /**
   * Default quiz when no URL param. Stored in `site_branding.default_quiz_id`.
   * Prefer `getDefaultQuizId()` (also respects `site_config.default_quiz_id_override`).
   */
  quiz?: {
    defaultQuizId?: string;
  };
}

/** Parses `#RRGGBB` into space-separated channels for Tailwind opacity utilities. */
export function hexToRgbChannels(hex: string): string | null {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const n = Number.parseInt(normalized, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r} ${g} ${b}`;
}

/** Tailwind theme entry: solid + `/opacity` modifiers read runtime `:root` vars. */
export function brandColorToTailwindValue(token: string): string {
  return `rgb(var(--${token}-rgb) / <alpha-value>)`;
}

/**
 * Formats a font stack for CSS `font-family` from token names
 * (e.g. "Some Font" → quoted).
 */
export function fontStackToCssValue(families: string[]): string {
  return families
    .map((name) => (/\s/.test(name) ? `"${name}"` : name))
    .join(", ");
}

/**
 * Build `:root { --token: value; }` for colors + (optionally) font stacks.
 *
 * Font stacks are NOT computed here — pass them in from a server-only context
 * (typically via `import { resolvedFontStacks } from "~/data/fonts.server"`)
 * so this module stays browser-safe.
 */
export function buildBrandRootStyle(
  common: CommonData,
  fontStacks: Record<string, string[]> = {},
): string {
  const brand = common.brand;
  if (!brand?.colors) return "";

  const lines: string[] = [];

  for (const [key, value] of Object.entries(brand.colors)) {
    lines.push(`  --${key}: ${value};`);
    const rgb = hexToRgbChannels(value);
    if (rgb) {
      lines.push(`  --${key}-rgb: ${rgb};`);
    }
  }

  for (const [key, stack] of Object.entries(fontStacks)) {
    lines.push(`  --${key}: ${fontStackToCssValue(stack)};`);
  }

  if (lines.length === 0) return "";
  return `:root {\n${lines.join("\n")}\n}`;
}
