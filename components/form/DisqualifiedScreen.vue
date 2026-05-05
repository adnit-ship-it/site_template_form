<template>
  <div class="flex flex-col items-center justify-center min-h-[400px] px-4 py-12">
    <div class="max-w-md text-center space-y-6">
      <!-- Icon -->
      <div class="flex justify-center">
        <svg class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <!-- Title -->
      <h1 class="text-2xl font-bold text-bodyColor">
        Thank You for Your Honesty
      </h1>

      <!-- Message -->
      <p class="text-lg text-bodyColor/80">
        Based on your responses, GLP-1 treatment may not be the best option for you at this time.
      </p>

      <p class="text-base text-bodyColor/70">
        We recommend consulting with your healthcare provider to discuss alternative treatment options that may be more suitable for your specific health situation.
      </p>

      <!-- Additional Info -->
      <div class="bg-gray-50 rounded-lg p-4 text-sm text-left text-bodyColor/70">
        <p class="font-semibold mb-2">Why this matters:</p>
        <p>Your safety is our top priority. Certain medical conditions may increase the risk of complications with GLP-1 medications. A healthcare provider can help you explore safer alternatives.</p>
      </div>

      <!-- Back Home Button -->
      <div class="pt-4">
        <a 
          href="/" 
          class="inline-block w-full px-8 py-3 bg-accentColor1 text-white font-semibold rounded-full hover:bg-accentColor1/90 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed - this is a static informational screen
</script>
