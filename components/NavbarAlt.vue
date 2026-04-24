<template>
  <header class="w-full">
    <!-- Top Marquee Banner -->
    <div class="bg-[#E4ECF7] py-2 overflow-hidden">
      <div class="marquee-container">
        <div class="marquee-content">
          <!-- Multiple sets of items for seamless scrolling on large screens -->
          <div v-for="setIndex in 4" :key="`set-${setIndex}`" class="flex items-center gap-12">
            <div v-for="(item, index) in marqueeItems" :key="`${setIndex}-${index}`" class="flex items-center gap-2 whitespace-nowrap">
              <img src="/assets/images/icons/tick.svg" alt="" class="h-4 w-4 flex-shrink-0" />
              <span class="text-sm text-[#111827]">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Navbar -->
    <nav class="bg-white relative">
      <div class="max-w-[1336px] mx-auto px-6 md:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex-shrink-0">
            <img src="/assets/images/brand/logo.png" alt="THE" class="h-8 w-auto" />
          </NuxtLink>

          <!-- Navigation Links (Desktop) -->
          <div class="hidden lg:flex items-center gap-8">
            <a href="#how-it-works" class="font-medium text-[#374151] hover:text-accentColor1 transition-colors cursor-pointer">
              How it works
            </a>
            <a href="#reviews" class="font-medium text-[#374151] hover:text-accentColor1 transition-colors cursor-pointer">
              Reviews
            </a>
            <a href="#faqs" class="font-medium text-[#374151] hover:text-accentColor1 transition-colors cursor-pointer">
              FAQ's
            </a>
            <a href="#pricing" class="font-medium text-[#374151] hover:text-accentColor1 transition-colors cursor-pointer">
              Pricing
            </a>
          </div>

          <!-- CTA Button -->
          <div class="flex items-center gap-4">
            <UiButton 
              label="Start Your Journey" 
              color="accentColor1" 
              @click="navigateTo('/')"
              class="hidden lg:block px-5 !font-semibold"
            />
            
            <!-- Mobile Menu Button -->
            <button 
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="lg:hidden p-2 text-[#374151]"
              aria-label="Toggle menu"
            >
              <svg v-if="!mobileMenuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div v-if="mobileMenuOpen" class="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 py-4">
          <div class="flex flex-col gap-4 px-6 md:px-8">
            <a 
              href="#how-it-works" 
              class="text-sm font-medium text-[#374151] hover:text-accentColor1 transition-colors cursor-pointer"
              @click="mobileMenuOpen = false"
            >
              How it works
            </a>
            <a 
              href="#reviews" 
              class="text-sm font-medium text-[#374151] hover:text-accentColor1 transition-colors cursor-pointer"
              @click="mobileMenuOpen = false"
            >
              Reviews
            </a>
            <a 
              href="#faqs" 
              class="text-sm font-medium text-[#374151] hover:text-accentColor1 transition-colors cursor-pointer"
              @click="mobileMenuOpen = false"
            >
              FAQ's
            </a>
            <a 
              href="#pricing" 
              class="text-sm font-medium text-[#374151] hover:text-accentColor1 transition-colors cursor-pointer"
              @click="mobileMenuOpen = false"
            >
              Pricing
            </a>
            <UiButton 
              label="Start Your Journey" 
              color="accentColor1" 
              @click="() => { navigateTo('/'); mobileMenuOpen = false; }"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const mobileMenuOpen = ref(false)

const marqueeItems = [
  'Accessible & Affordable',
  'Personalized Treatment Plans',
  'Certified Medical Professionals',
  'Safe & Effective Medications'
]
</script>

<style scoped>
.marquee-container {
  display: flex;
  overflow: hidden;
  user-select: none;
}

.marquee-content {
  display: flex;
  gap: 3rem; /* gap-12 */
  animation: scroll 40s linear infinite;
  will-change: transform;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-25%); /* 4 sets, so scroll 1/4 of the way */
  }
}

/* Pause on hover */
.marquee-container:hover .marquee-content {
  animation-play-state: paused;
}
</style>
