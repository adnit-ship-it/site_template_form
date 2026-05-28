import type { ProductQuizLookup } from "~/server/api/products/[productId].get";

/**
 * Resolves `?productId=<slug>` to its `quizId` BEFORE the consultation
 * page renders, and stashes the result in `useState('resolvedProductQuizId')`
 * for `usePatientForm()` to read synchronously.
 *
 * Why a middleware (and not a top-level `await` in the page setup)?
 * A `<script setup>` containing `await` is compiled to an async setup
 * function. Async setups are wrapped by Nuxt's <Suspense>, which on
 * client-side hydration emits a comment placeholder until the promise
 * resolves — that placeholder doesn't match the SSR-rendered fragment
 * and causes a `Hydration node mismatch` warning at the top of the page
 * component.
 *
 * Route middleware runs:
 *   - on the server during SSR (so the result lands in the SSR payload),
 *   - on the client during route navigations to /consultation,
 *   - but NOT during initial client-side hydration of the SSR-rendered
 *     page (the result is already in the payload).
 *
 * That last point is the key: the page's `<script setup>` stays
 * synchronous, hydration is clean, and `useState('resolvedProductQuizId')`
 * is populated correctly in every entry path.
 *
 * Resolution rules (mirrors `usePatientForm`'s `selectedQuizId` ladder):
 *   1. `?productId=<slug>` present → fetch /api/products/[productId] and
 *      stash `quizId` (or null when the product isn't in Supabase).
 *   2. No `productId` → write `null` so the composable falls through to
 *      `?categoryId=` or `getDefaultQuizId()`.
 *
 * Variation-UUID resolution (`productId` is a `variations[].id`) is
 * intentionally NOT performed here — only product slugs map to quiz ids.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const resolvedProductQuizId = useState<string | null>(
    "resolvedProductQuizId",
    () => null,
  );

  const productId = to.query.productId as string | undefined;

  if (!productId) {
    resolvedProductQuizId.value = null;
    return;
  }

  try {
    const result = await $fetch<ProductQuizLookup>(
      `/api/products/${encodeURIComponent(productId)}`,
    );
    resolvedProductQuizId.value = result.quizId;
  } catch (err) {
    if (import.meta.dev) {
      console.warn(
        "[resolve-product-quiz] product quiz lookup failed:",
        err,
      );
    }
    resolvedProductQuizId.value = null;
  }
});
