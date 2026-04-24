<template>
  <div class="bg-white rounded-[24px] pt-8 pb-10 lg:pt-10 lg:pb-14 flex flex-col items-center px-10 lg:px-[78px]">
    <!-- Title -->
    <h3 class="text-[36px]/[40px] lg:text-[46px]/[48px] font-light text-[#111827] capitalize">{{ title }}</h3>

    <!-- Subtitle (20px below) -->
    <p class="mt-4 lg:mt-5 text-xs/[22px] text-black">{{ subtitle }}</p>

    <!-- Horizontal Line (20px below) -->
    <div class="h-[1px] bg-[#e5e7eb] w-full mt-4 lg:mt-5"></div>

    <!-- Image Container (32px py) -->
    <div class="py-6 lg:py-8 flex items-center justify-center">
      <img :src="img" :alt="title" class="h-[220px] lg:h-[276px] w-auto object-contain" />
    </div>

    <!-- Gradient Button -->
    <button @click="navigateTo('/')" class="gradient-button w-[200px] h-[42px] text-white font-semibold rounded-full text-[12px]/[16px]">
      In Stock • Starting at ${{ price }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  img: string
  price: number
}>()
</script>

<style scoped>
.gradient-button {
  background: linear-gradient(to bottom, #6993b7 0%, #2C528B 100%);
}
</style>
