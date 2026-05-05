import { ref } from "vue";

/**
 * Shared "back button" slot for the site navbar.
 *
 * Any page can call `setBack(handler)` to show a back button in the navbar
 * that runs `handler` when clicked. Pages are expected to `clearBack()` in
 * `onBeforeUnmount` to avoid leaking a stale handler to the next page.
 *
 * The state lives at module scope (a plain `ref`) rather than in `useState`
 * so we don't pay for SSR payload serialization of a function value; the
 * back button is a client-side interaction and doesn't need to hydrate.
 */
const backHandler = ref<(() => void) | null>(null);
const backLabel = ref<string>("Go back");

export const useNavbarBack = () => {
  const setBack = (handler: (() => void) | null, label = "Go back") => {
    backHandler.value = handler;
    backLabel.value = label;
  };

  const clearBack = () => {
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
