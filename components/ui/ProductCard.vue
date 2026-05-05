<template>
  <div @click="handleClick"
    class="w-full relative flex flex-col gap-1 items-center h-[428px] rounded-2xl min-[380px]:p-5 p-3 pt-12 bg-backgroundColor2 cursor-pointer transition-all duration-200 max-w-[328px]"
    :class="[
      isSelected ? 'ring-2 ring-accentColor1' : '',
      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
    ]">
    <!-- Tag -->
    <div v-if="tag" class="absolute top-4 left-4 text-[13px] px-4 py-1 rounded-full font-medium"
      :class="tag === 'Limited Stock' ? 'bg-[#ffd9d9] text-[#e63e3e]' : 'bg-[#FDE9AB] text-[#B68C0A]'">
      {{ tag }}
    </div>

    <NuxtImg :src="image" :alt="name" class="h-[212px] object-contain w-auto" />
    <div class="flex flex-col gap-0.5 mt-2 items-center">
      <p class="text-xs/[22px] font-semibold">Starting at ${{ price }}</p>
      <h3 class="sm:text-xl text-base text-center font-semibold">{{ name }}</h3>
      <p v-if="displayDescription" class="min-[380px]:text-xs/[22px] text-[10px]">{{ displayDescription }}</p>
    </div>
    <!-- Checkout mode: Single Select/Selected button -->
    <div v-if="isCheckout" class="flex justify-center mt-4">
      <button @click.stop="handleClick" :disabled="isDisabled"
        class="w-[140px] h-10 md:h-[42px] rounded-full font-semibold tracking-tightest transition-colors border-2"
        :class="isDisabled
          ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
          : isSelected
            ? 'bg-accentColor1 text-white border-accentColor1'
            : 'bg-transparent text-accentColor1 border-accentColor1'">
        {{ isSelected ? 'Selected' : 'Select' }}
      </button>
    </div>

    <!-- Regular mode: Two buttons -->
    <div v-else-if="showButtons" class="flex justify-center gap-2">
      <UiButton showAnimation v-if="id" to="/"
        color="accentColor1" label="get started" link-class="relative z-20"
        class="min-[380px]:w-[140px] min-[380px]:text-[13px] text-xs w-[100px] mt-4 font-semibold tracking-tightest relative" />
      <UiButton v-if="id" to="/" color="transparent" label="learn more" link-class="relative z-20"
        class="min-[380px]:w-[140px] min-[380px]:text-[13px] text-xs w-[100px] mt-4 font-semibold tracking-tightest border border-accentColor1 !text-accentColor1 relative" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id?: string
  name: string
  image: string
  price: number
  description?: string
  type?: 'injections' | 'oral_drops' | 'oral_pills'
  isSelected?: boolean
  isDisabled?: boolean
  showButtons?: boolean
  isCheckout?: boolean
  showTag?: boolean
  tag?: string
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isDisabled: false,
  showButtons: false,
  isCheckout: false,
  showTag: false
})

const emit = defineEmits<Emits>()

const displayDescription = computed(() => {
  // If explicit description is provided, use it
  if (props.description) {
    return props.description
  }

  // Otherwise, use type-based description
  if (props.type === 'injections') {
    return 'One simple injection per week'
  } else if (props.type === 'oral_pills') {
    return 'One dissolvable tablet per day'
  }

  return undefined
})

const handleClick = (event?: Event) => {
  if (event) {
    event.stopPropagation()
  }
  if (!props.isDisabled) {
    emit('click')
  }
}
</script>
