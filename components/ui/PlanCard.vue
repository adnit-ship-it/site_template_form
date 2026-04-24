<template>
  <div @click="handleClick" @keydown.enter="handleClick" @keydown.space.prevent="handleClick"
    tabindex="0" role="radio" :aria-checked="isSelected" :aria-disabled="isDisabled"
    class="plan-card w-full h-[156px] lg:h-[147px] p-2.5 bg-white border-2 rounded-[6px] cursor-pointer transition-all duration-200 relative flex flex-row gap-3 lg:gap-4"
    :class="[
      isSelected ? 'border-accentColor1' : 'border-gray-300',
      isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accentColor1'
    ]">
    <!-- Radio Button / Checkmark -->
    <div v-if="isSelected"
      class="absolute top-4 right-4 w-6 h-6 rounded-full bg-accentColor1 flex items-center justify-center">
      <img src="/assets/images/brand/check-alt.svg" alt="Selected" class="w-4 h-4" />
    </div>
    <div v-else class="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-gray-400"></div>

    <!-- Image -->
    <div
      class="w-[108px] h-full flex items-end justify-center flex-shrink-0 bg-[#e4ecf7] rounded-[6px] overflow-hidden">
      <NuxtImg :src="image" :alt="name" class="h-[100%] w-full object-cover" />
    </div>

    <!-- Content -->
    <div class="flex flex-col justify-between flex-1">
      <!-- Title and Badge -->
      <div class="flex flex-col justify-center h-full gap-2">
        <h3 class="text-base/[18px] lg:text-xl/[24px] font-semibold text-bodyColor mr-8 lg:mr-0">{{ name }}</h3>
        <p v-if="subName" class="text-[13px] text-bodyColor/70">{{ subName }}</p>
        <p class="text-[13px] text-[#4a5565]">{{ description }}</p>

        <!-- Badge -->
        <div v-if="badge" class="mt-1 flex">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
            class="h-4 mr-1 text-[#033070]" v-if="badgeColor !== 'green'">
            <path fill-rule="evenodd"
              d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
              clip-rule="evenodd"></path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
            class="h-4 mr-1 text-[#35598d]" v-else>
            <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"></path>
            <path fill-rule="evenodd"
              d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
              clip-rule="evenodd"></path>
            <path
              d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z">
            </path>
          </svg>
          <span class="inline-block pr-3 py-0 rounded-md min-[372px]:text-sm text-xs font-semibold"
            :class="badgeColor === 'green' ? 'text-[#35598d]' : 'text-[#033070]'">
            {{ badge }}
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string
  subName?: string
  image: string
  description: string
  badge?: string
  badgeColor?: 'green' | 'purple'
  patientCount?: string
  isSelected?: boolean
  isDisabled?: boolean
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isDisabled: false,
  badgeColor: 'green',
  patientCount: '11,773'
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  if (!props.isDisabled) {
    emit('click')
  }
}
</script>

<style scoped>
.plan-card:focus-visible {
  @apply ring-2 ring-accentColor1 ring-offset-2 outline-none;
}
</style>
