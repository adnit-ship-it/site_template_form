import type { Config } from "tailwindcss";
import { brandColorToTailwindValue } from "./data/common-helpers";
import { DEFAULT_BRANDING } from "./data/default-branding";
import { resolvedFontStacks } from "./data/fonts.server";

const c = DEFAULT_BRANDING;

if (!c.brand?.colors) {
  throw new Error("[tailwind] DEFAULT_BRANDING must define brand.colors (build-time fallback).");
}

// Utilities reference CSS variables injected from Supabase (`site_branding.colors`),
// not static hex baked at build time.
const tailwindBrandColors = Object.fromEntries(
  Object.keys(c.brand.colors).map((key) => [key, brandColorToTailwindValue(key)]),
);

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        ...tailwindBrandColors,
      },
      // Font stacks are derived from assets/fonts/ via data/fonts.ts so that
      // the dashboard can swap fonts by dropping a .woff2 into the folder.
      fontFamily: { ...resolvedFontStacks },
    },
  },
  plugins: [],
} satisfies Config;
