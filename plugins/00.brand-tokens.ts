import common from "~/data/common.json";
import { buildBrandRootStyle, type CommonData } from "~/data/common-helpers";

/**
 * Injects :root CSS variables from data/common.json as early as possible (enforce: pre).
 * Tailwind theme in tailwind.config.ts reads the same file at build time.
 */
export default defineNuxtPlugin({
  name: "brand-tokens",
  enforce: "pre",
  setup() {
    const css = buildBrandRootStyle(common as CommonData);
    if (!css) return;

    useHead({
      style: [
        {
          "data-source": "data/common.json",
          innerHTML: css,
          key: "brand-tokens-root",
        },
      ],
    });
  },
});
