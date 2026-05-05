export default defineNuxtPlugin((nuxtApp) => {
  if (process.client) {
    const { startTracking } = useInactivityTimer();
    
    // Start tracking after app is mounted
    nuxtApp.hook('app:mounted', () => {
      const cleanup = startTracking();
      
      // Cleanup when app is unmounted
      nuxtApp.hook('app:beforeUnmount', () => {
        if (cleanup) cleanup();
      });
    });
  }
});
