/**
 * Smoothly scrolls to the top of the page
 * @param behavior - Scroll behavior, defaults to 'smooth'
 */
export function scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
  if (process.client) {
    window.scrollTo({
      top: 0,
      behavior
    });
  }
}

/**
 * Scrolls to the top of a specific element
 * @param element - The element to scroll to
 * @param behavior - Scroll behavior, defaults to 'smooth'
 */
export function scrollToElement(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
  if (process.client && element) {
    element.scrollIntoView({
      behavior,
      block: 'start'
    });
  }
}

/**
 * Scrolls to the top of the page with a fallback for older browsers
 */
export function scrollToTopWithFallback(): void {
  if (process.client) {
    try {
      // Try smooth scrolling first
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      // Fallback for browsers that don't support smooth scrolling
      window.scrollTo(0, 0);
    }
  }
} 