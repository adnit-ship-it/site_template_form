/**
 * Server / build-only font detection. Uses `node:fs` and MUST NOT be imported
 * from client code (Vue components, .client plugins, etc.) or it will break
 * the Vite client bundle.
 *
 * Safe import sites:
 *   - tailwind.config.ts            (build time)
 *   - nuxt.config.ts                (build time)
 *   - plugins/*.server.ts           (SSR only)
 *   - server/**                     (Nitro)
 *   - test/**                       (Node)
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FONT_FAMILIES,
  FONT_FILES,
  type FontPresence,
  type FontStackKey,
} from "./fonts";

const here = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = resolve(here, "../assets/fonts");

const has = (file: string): boolean => existsSync(resolve(FONTS_DIR, file));

export const fontPresence: FontPresence = {
  body: has(FONT_FILES.body),
  heading: has(FONT_FILES.heading),
};

export const bodyStack: string[] = [FONT_FAMILIES.body, "sans-serif"];

export const headingStack: string[] = fontPresence.heading
  ? [FONT_FAMILIES.heading, FONT_FAMILIES.body, "sans-serif"]
  : bodyStack;

export const resolvedFontStacks: Record<FontStackKey, string[]> = {
  bodyFont: bodyStack,
  headingFont: headingStack,
  // Back-compat alias: a few components still reference `font-headingAlt`.
  headingAlt: headingStack,
};
