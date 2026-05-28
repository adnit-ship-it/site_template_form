/**
 * Browser-safe font constants. Pure data, no Node APIs — safe to import from
 * Vue components, composables, plugins, anywhere.
 *
 * The actual *resolved* font stacks (i.e. whether a heading font file was
 * uploaded) are computed at build/server start in `data/fonts.server.ts`,
 * which uses `node:fs` and must NEVER be imported from client code.
 *
 * Convention:
 *   - assets/fonts/bodyFont.woff2     (required)  → drives <body>, <p>, <button>
 *   - assets/fonts/headingFont.woff2  (optional)  → drives <h1>, <h2>, <h3>
 *
 * Client code that needs the actual resolved stack should read the
 * `--bodyFont` / `--headingFont` CSS variables, which are injected during
 * SSR by `plugins/00.brand-tokens.server.ts`. Whether each font file is
 * present is exposed on `useRuntimeConfig().public.fontPresence`.
 */

export const FONT_FAMILIES = {
  body: "BodyFont",
  heading: "HeadingFont",
} as const;

export const FONT_FILES = {
  body: "bodyFont.woff2",
  heading: "headingFont.woff2",
} as const;

/** Keys used both for Tailwind's font-family map and for the --xxxFont CSS vars. */
export const FONT_STACK_KEYS = ["bodyFont", "headingFont", "headingAlt"] as const;
export type FontStackKey = (typeof FONT_STACK_KEYS)[number];

export interface FontPresence {
  body: boolean;
  heading: boolean;
}
