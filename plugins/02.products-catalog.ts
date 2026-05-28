import type { ProductsCatalog } from "~/server/api/products.get";

const EMPTY_CATALOG: ProductsCatalog = { categories: [], products: [] };

/**
 * Fetches `/api/products` once per page load and pins the result into the
 * `useState('products-catalog')` slot read by `useProductsCatalog()`.
 *
 * Mirrors `01.runtime-config.ts` exactly — runs on both SSR and client,
 * `useFetch` with a stable key dedupes the round-trip via the SSR payload.
 *
 * Plugin order: must run AFTER `01.runtime-config` (so brand tokens and
 * site config are already resolved) but before any page setup that reads
 * the catalog. The `02.` prefix enforces ordering.
 */
export default defineNuxtPlugin({
  name: "products-catalog",
  enforce: "pre",
  async setup() {
    const state = useState<ProductsCatalog>(
      "products-catalog",
      () => EMPTY_CATALOG,
    );

    try {
      const { data, error } = await useFetch<ProductsCatalog>(
        "/api/products",
        {
          key: "products-catalog",
          default: () => state.value,
        },
      );

      if (error.value) {
        console.warn(
          "[products-catalog plugin] fetch failed, using empty catalog:",
          error.value.message,
        );
        return;
      }

      if (data.value) {
        state.value = data.value;
      }
    } catch (err) {
      console.warn("[products-catalog plugin] unexpected error:", err);
    }
  },
});
