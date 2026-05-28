import { getServerSupabase } from "~/server/utils/supabase";
import { getCurrentOrgId } from "~/server/utils/orgId";
import type { Category, Product } from "~/types/checkout";

/**
 * Shape returned to the client. Matches the legacy `data/products.ts`
 * exports (`categories` is the nested `Category[]` with `products` embedded;
 * `products` is the flat `Product[]` derived from those categories) so
 * downstream consumers don't need to learn a new contract.
 */
export interface ProductsCatalog {
  categories: Category[];
  products: Product[];
}

const EMPTY_CATALOG: ProductsCatalog = { categories: [], products: [] };

/**
 * Returns the full products catalog (categories + their nested products) for
 * the current deployment's `org_id`.
 *
 * DB-only — there is no local-JSON fallback. If `org_id` isn't configured
 * or the Supabase fetch fails the catalog is empty, and consumers fall
 * through to whatever empty-state UX they implement.
 *
 * Cached for 60s in the Nitro storage layer (mirrors `runtime-config.get.ts`).
 * The `01.runtime-config` plugin fetches it once per app load and pins the
 * result into `useState('products-catalog')` via the products plugin.
 *
 * Snake_case columns from Supabase are mapped to the camelCase shape used by
 * the `Category` / `Product` interfaces in `types/checkout.ts`.
 */
export default defineCachedEventHandler(
  async (event): Promise<ProductsCatalog> => {
    const orgId = getCurrentOrgId(event);
    if (!orgId) return EMPTY_CATALOG;

    const supabase = getServerSupabase();
    if (!supabase) return EMPTY_CATALOG;

    if (import.meta.dev) {
      console.log(
        `[products-catalog] cache miss — fetching from Supabase for org_id="${orgId}"`,
      );
    }

    try {
      const [catRes, prodRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, images, availability")
          .eq("org_id", orgId),
        supabase
          .from("products")
          .select(
            "id, category_id, name, selection_name, quiz_id, intro, type, images, tag, description, variations, availability",
          )
          .eq("org_id", orgId),
      ]);

      if (catRes.error) {
        console.error(
          "[products-catalog] categories select failed:",
          catRes.error.message,
        );
      }
      if (prodRes.error) {
        console.error(
          "[products-catalog] products select failed:",
          prodRes.error.message,
        );
      }

      const productsByCategory = new Map<string, Product[]>();
      for (const row of prodRes.data ?? []) {
        const product: Product = {
          id: row.id,
          name: row.name,
          selectionName: row.selection_name ?? undefined,
          quizId: row.quiz_id ?? undefined,
          intro: row.intro ?? undefined,
          type: row.type,
          images: row.images,
          tag: row.tag ?? undefined,
          description: row.description ?? undefined,
          variations: row.variations ?? [],
          availability: row.availability,
        };
        const list = productsByCategory.get(row.category_id) ?? [];
        list.push(product);
        productsByCategory.set(row.category_id, list);
      }

      const categories: Category[] = (catRes.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        images: c.images,
        availability: c.availability,
        products: productsByCategory.get(c.id) ?? [],
      }));

      const products: Product[] = categories.flatMap((c) => c.products);

      if (import.meta.dev) {
        console.log(
          `[products-catalog] resolved ${categories.length} categories / ${products.length} products for "${orgId}"`,
        );
      }

      return { categories, products };
    } catch (err) {
      console.error("[products-catalog] unexpected error:", err);
      return EMPTY_CATALOG;
    }
  },
  {
    maxAge: 60,
    getKey: (event) =>
      `products-catalog:${getCurrentOrgId(event) ?? "anon"}`,
    name: "products-catalog",
  },
);
