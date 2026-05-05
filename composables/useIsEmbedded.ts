import { ref, onMounted } from "vue";

/**
 * Detects whether the app is running inside an iframe (i.e. embedded by a
 * third-party parent page).
 *
 * SSR-safe: returns `false` during server render and on the first client tick,
 * then flips to `true` after mount if we're actually framed. This avoids
 * hydration mismatches since the initial HTML always matches either context.
 *
 * Consumers should read `isEmbedded.value` and treat it as reactive so any
 * UI that hides itself in embed mode updates correctly.
 *
 * Usage:
 *   const isEmbedded = useIsEmbedded()
 *   <div v-if="!isEmbedded">Only visible outside the iframe</div>
 */
export const useIsEmbedded = () => {
  const isEmbedded = ref(false);

  onMounted(() => {
    try {
      isEmbedded.value = window.self !== window.top;
    } catch {
      // Accessing `window.top` across origins can throw a SecurityError in
      // some browsers. If it throws, we are definitely inside a cross-origin
      // iframe, so treat that as embedded.
      isEmbedded.value = true;
    }
  });

  return isEmbedded;
};
