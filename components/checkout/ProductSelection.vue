<template>
  <div>
    <!-- Header -->
    <div class="text-center mb-6 md:mb-12">
      <h1 class="text-[20px] md:text-[36px] font-bold text-bodyColor font-headingFont leading-[28px] md:leading-[56px]">
        You are almost done, {{ firstName }}Select your preferred medication
      </h1>
    </div>

    <!-- Product Selection Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <div
        v-for="category in categories"
        :key="category.id"
        @click="!isSubmitting && selectCategory(category)"
        @keydown.enter="!isSubmitting && selectCategory(category)"
        @keydown.space.prevent="!isSubmitting && selectCategory(category)"
        tabindex="0" role="radio" :aria-checked="selectedCategory?.id === category.id" :aria-disabled="isSubmitting"
        class="category-card relative bg-white p-4 md:p-8 cursor-pointer border-2 transition-all duration-200 hover:border-accentColor1"
        :class="[
          selectedCategory?.id === category.id ? 'border-accentColor1' : 'border-bodyColor',
          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
        ]"
      >
        <!-- Radio Button -->
        <div class="absolute top-4 right-4">
          <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
               :class="selectedCategory?.id === category.id ? 'border-accentColor1' : 'border-bodyColor'">
            <div v-if="selectedCategory?.id === category.id"
                 class="w-3 h-3 rounded-full bg-accentColor1"></div>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-2xl md:text-4xl font-bold text-bodyColor font-headingFont mb-2 md:mb-3">
            {{ category.name }}
          </h3>
          <p class="text-bodyColor text-base md:text-xl leading-relaxed">
            {{ category.description }}
          </p>
        </div>

        <!-- Product Image -->
        <div class="w-full overflow-hidden">
          <img
            :src="category.images.mainImg"
            :alt="category.name"
            class="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="bg-white border-2 border-bodyColor p-6 mb-12">
      <h3 class="text-xl font-bold text-bodyColor font-headingFont mb-4">
        Trying to decide?
      </h3>
      <ul class="space-y-2 text-bodyColor">
        <li class="flex items-start">
          <img src="/assets/images/check_circle.svg" alt="Check" class="w-5 h-5 mt-0.5 mr-3 flex-shrink-0">
          <span>Semaglutide is typically more affordable</span>
        </li>
        <li class="flex items-start">
          <img src="/assets/images/check_circle.svg" alt="Check" class="w-5 h-5 mt-0.5 mr-3 flex-shrink-0">
          <span>Tirzepatide generally has fewer side effects</span>
        </li>
        <li class="flex items-start">
          <img src="/assets/images/check_circle.svg" alt="Check" class="w-5 h-5 mt-0.5 mr-3 flex-shrink-0">
          <span>Tizepatide showed greater weight loss in clinical trials</span>
        </li>
        <li class="flex items-start">
          <img src="/assets/images/check_circle.svg" alt="Check" class="w-5 h-5 mt-0.5 mr-3 flex-shrink-0">
          <span>Tirzepatide comes at a higher price point</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '~/types/checkout'
import { categories } from '~/data/products'
import { computed } from 'vue'

interface Props {
  selectedCategory: Category | null
  isSubmitting: boolean
  formAnswers: any
}

interface Emits {
  (e: 'select-category', category: Category): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const firstName = computed(() => {
  return props.formAnswers?.firstName || 'there'
})

const selectCategory = (category: Category) => {
  emit('select-category', category)
}
</script>

<style scoped>
/* Add hover effect to radio indicator when parent is hovered */
.grid > div:hover .w-6.h-6 {
  @apply border-accentColor1;
}

.category-card:focus-visible {
  @apply ring-2 ring-accentColor1 ring-offset-2 outline-none;
}
</style>
