import type { Config } from "tailwindcss";
import common from "./data/common.json";
import type { CommonData } from "./data/common-helpers";

const c = common as CommonData;

if (!c.brand?.colors) {
  throw new Error("[tailwind] data/common.json must define brand.colors (single source of truth).");
}

const { colors, fontStacks } = c.brand;

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        ...colors,
      },
      fontFamily: Object.fromEntries(
        Object.entries(fontStacks).map(([key, stack]) => [key, stack]),
      ),
    },
  },
  plugins: [],
} satisfies Config;
