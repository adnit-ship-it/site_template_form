import { getServerSupabase } from "~/server/utils/supabase";
import { getCurrentOrgId } from "~/server/utils/orgId";

/**
 * Result shape returned to the client. `quizId` is null when the product
 * isn't found in Supabase. The client treats null as "fall back to default
 * quiz".
 */
export interface ProductQuizLookup {
  productId: string;
  quizId: string | null;
  source: "supabase" | "none";
}

/**
 * Resolves a `productId` (slug, e.g. `compounded-semaglutide`) to its
 * `quizId` for the current deployment's `org_id`.
 *
 * DB-only — there is no local-JSON fallback. Misses (no row, missing env
 * vars, Supabase failure) all return `{ quizId: null }` and the caller
 * falls back to the default quiz.
 *
 * Cached for 60s, keyed on `org_id + productId` (mirrors `runtime-config.get.ts`).
 *
 * Variation-UUID fallback (where `productId` is a `variations[].id` UUID)
 * is intentionally NOT implemented here — only the product slug is
 * supported.
 */
export default defineCachedEventHandler(
  async (event): Promise<ProductQuizLookup> => {
    const productId = getRouterParam(event, "productId");
    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing productId path param",
      });
    }

    const orgId = getCurrentOrgId(event);
    const supabase = getServerSupabase();

    if (!orgId || !supabase) {
      if (import.meta.dev) {
        console.log(
          `[products] no Supabase configured for "${productId}" — caller will fall back to default quiz`,
        );
      }
      return { productId, quizId: null, source: "none" };
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select("quiz_id")
        .eq("org_id", orgId)
        .eq("id", productId)
        .maybeSingle();

      if (error) {
        console.error(
          "[products] supabase select failed:",
          error.message,
        );
      } else if (data?.quiz_id) {
        if (import.meta.dev) {
          console.log(
            `[products] resolved "${productId}" -> "${data.quiz_id}" (org="${orgId}")`,
          );
        }
        return {
          productId,
          quizId: data.quiz_id,
          source: "supabase",
        };
      }
    } catch (err) {
      console.error("[products] unexpected supabase error:", err);
    }

    if (import.meta.dev) {
      console.log(
        `[products] no match for "${productId}" — caller will fall back to default quiz`,
      );
    }
    return { productId, quizId: null, source: "none" };
  },
  {
    maxAge: 60,
    getKey: (event) =>
      `product-quiz:${getCurrentOrgId(event) ?? "anon"}:${
        getRouterParam(event, "productId") ?? "unknown"
      }`,
    name: "product-quiz",
  },
);
