import type { Category, Product } from "~/types/checkout";
import type { ProductsCatalog } from "~/server/api/products.get";

const EMPTY_CATALOG: ProductsCatalog = { categories: [], products: [] };

/**
 * Reads the products catalog (categories + their nested products) from the
 * shared `useState('products-catalog')` slot populated by
 * `plugins/02.products-catalog.ts` at app startup.
 *
 * Returns `Ref<Category[]>` and `Ref<Product[]>` so consumers can use the
 * data both reactively (templates auto-unwrap refs) and imperatively
 * (`categories.value.find(...)`).
 *
 * Until the plugin's fetch resolves the slot holds an empty catalog
 * (`{ categories: [], products: [] }`), so reads are always safe — never
 * undefined, never throwing.
 *
 * Mirrors the `useRuntimeConfigDB()` pattern: server-fetched, plugin-pinned,
 * synchronously read by consumers.
 */
export function useProductsCatalog() {
  const catalog = useState<ProductsCatalog>(
    "products-catalog",
    () => EMPTY_CATALOG,
  );

  const categories = computed<Category[]>(() => catalog.value.categories);
  const products = computed<Product[]>(() => catalog.value.products);

  return { catalog, categories, products };
}
