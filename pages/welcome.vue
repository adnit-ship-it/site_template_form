<template>
  <div class="flex items-center bg-backgroundColor justify-center min-h-[calc(100vh-200px)] px-6">
    <div class="max-w-[666px] w-full space-y-4">
      <div class="bg-white rounded-[16px] shadow-lg px-10 py-12 lg:py-16 text-center border border-black/10">
        <div class="mb-6">
          <div class="w-16 h-16 bg-accentColor1/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-accentColor1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-accentColor1 text-[40px] mb-2 font-headingAlt">Congratulations!</h1>
          <p class="text-black font-semibold">Your payment has been successfully processed.</p>
        </div>

        <p>
          Thank you for completing your medical intake form. We'll be in touch soon with next steps.
        </p>
       
        <!-- <p v-else class="text-sm text-gray-700">
          Since you live in a state that requires a Video Call visit before you can be prescribed, please click this link to book a free appointment:
        </p> -->
      </div>

      <!-- Calendly Link for Sync States -->
      <!-- <div v-if="showSync" class="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
        <a 
          href="https://calendly.com/altrx"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accentColor1 hover:text-accentColor1/80 underline font-medium text-sm md:text-base"
        >
          https://calendly.com/altrx
        </a>
      </div> -->

      <button @click="goHome"
        class="w-full bg-accentColor1 text-white py-3 px-4 rounded-full transition-colors">
        Back Home
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'

definePageMeta({
  layout: 'checkout'
})

const route = useRoute()
const nuxtApp = useNuxtApp()

// Check if showSync query parameter is true
const showSync = computed(() => route.query.showSync === 'true')

const config = useRuntimeConfig()

const goHome = () => {
  window.location.href = config.public.homeUrl as string
}

// Fire GTM event for payment success on page load
onMounted(() => {
  if (nuxtApp.$googleTagManager) {
    (nuxtApp.$googleTagManager as any).push({
      event: 'PAYMENT_SUCCESS'
    });
  }
})
</script>
