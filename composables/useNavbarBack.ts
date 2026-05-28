import { ref } from "vue";

/**
 * Shared "back button" slot for the site navbar.
 *
 * Any page can call `setBack(handler)` to show a back button in the navbar
 * that runs `handler` when clicked. Pages typically also call `clearBack()`
 * in `onBeforeUnmount`.
 *
 * The state lives at module scope (a plain `ref`) rather than in `useState`
 * so we don't pay for SSR payload serialization of a function value; the
 * back button is a client-side interaction and doesn't need to hydrate.
 *
 * Ownership semantics — important to avoid a navigation race:
 *   When Vue Router transitions from page A to page B, page B's setup runs
 *   BEFORE page A's `onBeforeUnmount`. Without protection, A's `clearBack()`
 *   would wipe the handler B just installed, so the back button would only
 *   appear after a hard refresh.
 *
 *   Each call to `useNavbarBack()` gets its own monotonically-increasing
 *   `setterId`. `setBack` records which setter is currently the owner, and
 *   `clearBack` is a no-op unless you're still the active owner. That way:
 *     - new page sets handler → ownership transfers to new page
 *     - old page's clearBack runs later → no-op, handler stays
 *     - same page calling setBack/clearBack repeatedly inside a watchEffect
 *       still works correctly because its setterId never changes
 */
const backHandler = ref<(() => void) | null>(null);
const backLabel = ref<string>("Go back");

let nextSetterId = 0;
let currentOwnerId = 0;

export const useNavbarBack = () => {
  const setterId = ++nextSetterId;

  const setBack = (handler: (() => void) | null, label = "Go back") => {
    currentOwnerId = setterId;
    backHandler.value = handler;
    backLabel.value = label;
  };

  const clearBack = () => {
    if (currentOwnerId !== setterId) return;
    backHandler.value = null;
  };

  const triggerBack = () => {
    backHandler.value?.();
  };

  return {
    backHandler,
    backLabel,
    setBack,
    clearBack,
    triggerBack,
  };
};
