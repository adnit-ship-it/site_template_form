export const useInactivityTimer = () => {
  const isPopupVisible = useState('inactivityPopupVisible', () => false);
  const hasShownPopup = useState('inactivityPopupShown', () => false);
  
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

  const resetTimer = () => {
    // Don't reset if popup has already been shown
    if (hasShownPopup.value) return;
    
    // Clear existing timer
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }

    // Start new timer
    inactivityTimer = setTimeout(() => {
      isPopupVisible.value = true;
      hasShownPopup.value = true;
    }, INACTIVITY_TIMEOUT);
  };

  const startTracking = () => {
    if (process.client) {
      // Activity events to track
      const events = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
        'click',
      ];

      // Start initial timer
      resetTimer();

      // Add event listeners for all activity events
      events.forEach(event => {
        document.addEventListener(event, resetTimer, true);
      });

      // Cleanup function
      return () => {
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
        events.forEach(event => {
          document.removeEventListener(event, resetTimer, true);
        });
      };
    }
  };

  const closePopup = () => {
    isPopupVisible.value = false;
  };

  return {
    isPopupVisible,
    hasShownPopup,
    startTracking,
    closePopup,
  };
};
