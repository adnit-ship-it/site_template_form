<template>
  <div class="frequency-card border-2 rounded-[6px] min-[372px]:p-4 p-2 lg:p-6 cursor-pointer transition-all"
       :class="isSelected ? 'border-[#01cd8b] bg-[#01cd8b]/10' : 'border-gray-300 bg-white'"
       @click="handleClick" @keydown.enter="handleClick" @keydown.space.prevent="handleClick"
       tabindex="0" role="radio" :aria-checked="isSelected">

    <!-- Header -->
    <div class="flex justify-between min-[372px]:items-center items-start mb-2">
      <div class="flex items-center gap-2.5 lg:gap-4">
        <h3 class="min-[372px]:text-lg text-base lg:text-xl font-bold text-bodyColor lg:w-[137px] text-nowrap">{{ title }}</h3>
        <span v-if="badge" class="text-xs min-[380px]:text-sm font-semibold text-nowrap px-2 lg:px-3 py-0.5 rounded-full"
              :class="badgeAlt ? 'bg-[#DDE9F8] text-[#23619d]' : 'bg-[#CEF6E9] text-[#019061]'">
          {{ badge }}
        </span>
      </div>
      <p class="min-[380px]:text-base text-xs min-[372px]:text-sm text-center min-[372px]:text-left  font-semibold min-[372px]:text-nowrap text-bodyColor">{{ supplyLabel }}</p>
    </div>

    <!-- Subtitle -->
    <p class="text-sm text-bodyColor mb-4">{{ subtitle }}</p>

    <!-- Installment Info (for non-monthly plans) -->
    <div v-if="showInstallments" class="mb-4 flex justify-between items-center">
      <div>
        <p class="text-base font-semibold text-bodyColor">Easy 0% Installments</p>
        <p class="text-sm text-bodyColor">Spread payments over 12 months</p>
      </div>
      <div class="flex gap-2 flex-wrap items-center justify-center">
        <img src="/assets/images/icons/affirm.png" alt="Affirm" class="h-6 w-auto object-contain"/>
        <img src="/assets/images/icons/klarna.png" alt="Klarna" class="h-6 w-auto object-contain"/>
        <img src="/assets/images/icons/afterpay.png" alt="Afterpay" class="h-8 -mt-1 w-auto object-contain"/>
      </div>
    </div>

    <!-- Savings Banner -->
    <div class="bg-[#d1f4e0] border border-[#01cd8b] border-dashed rounded-lg py-3 px-4 mb-4 text-center">
      <p class="text-[#019061] font-semibold text-base">{{ savingsText }}</p>
    </div>

    <!-- Select Button -->
    <button
        :class="btnColor=='gray'?'text-black bg-[#9db4c7] hover:bg-[#8ba3b6]':'text-white bg-accentColor1 hover:bg-accentColor1/80'"
        class="w-full font-semibold py-4 rounded-lg text-center transition-colors">
      <span v-if="originalPrice" class="block">
        Select Plan | <span class="line-through">${{ originalPrice }}/month</span>
      </span>
      <span v-else class="block text-lg font-semibold">Select Plan | ${{ monthlyPrice }}/month</span>
      <span v-if="limitedOfferPrice" class="block text-lg font-normal">PAY ONLY <span class="font-semibold">${{
          limitedOfferPrice
        }}</span> LIMITED OFFER</span>

    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle: string
  supplyLabel: string
  badge?: string
  badgeAlt?: boolean
  showInstallments?: boolean
  savingsText: string
  monthlyPrice: string
  originalPrice?: string
  limitedOfferPrice?: string
  isSelected: boolean
  btnColor?: string
}

interface Emits {
  (e: 'click'): void
}

const props = withDefaults(defineProps<Props>(), {
  badgeAlt: false,
  showInstallments: false
})

const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.frequency-card:focus-visible {
  @apply ring-2 ring-accentColor1 ring-offset-2 outline-none;
}
</style>
