<template>
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black z-50 py-4 px-4 md:px-6 lg:px-8">
    <div class="w-full max-w-[1248px] mx-auto flex gap-2 md:gap-7 justify-center">
    <!-- Back Button -->
      <button 
        @click="!isSubmitting && handleBack()"
        :disabled="isBackDisabled || isSubmitting"
        class="w-full text-sm md:text-xl font-bold uppercase h-10 md:h-16 rounded-full transition-colors flex items-center justify-center gap-2 md:gap-4"
      :class="!isBackDisabled && !isSubmitting ? 'text-bodyColor border-2 border-bodyColor' : 'bg-gray-300 text-gray-500 cursor-not-allowed'">
      <svg class="w-[12px] md:w-[16px]" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.23613 8.70806L7.67988 12.1518C7.92155 12.3935 8.03755 12.6754 8.02788 12.9976C8.01822 13.3199 7.90222 13.6018 7.67988 13.8435C7.43822 14.0851 7.15144 14.2112 6.81955 14.2217C6.48766 14.2322 6.20048 14.1162 5.95801 13.8737L0.429882 8.34555C0.188216 8.10389 0.0673828 7.82194 0.0673828 7.49972C0.0673828 7.1775 0.188216 6.89556 0.429882 6.65389L5.95801 1.12576C6.19967 0.884097 6.48686 0.768501 6.81955 0.778973C7.15224 0.789445 7.43902 0.915111 7.67988 1.15597C7.90141 1.39764 8.01741 1.67958 8.02788 2.00181C8.03835 2.32403 7.92236 2.60597 7.67988 2.84764L4.23613 6.29139H17.7091C18.0514 6.29139 18.3386 6.40739 18.5706 6.63939C18.8026 6.87139 18.9182 7.15817 18.9174 7.49972C18.9174 7.84208 18.8014 8.12926 18.5694 8.36126C18.3374 8.59326 18.0506 8.70886 17.7091 8.70806H4.23613Z" fill="currentColor"/>
      </svg>
      {{ backText }}
    </button>

    <!-- Next/Continue Button -->
    <button 
      @click="!isSubmitting && handleNext()"
      :disabled="isNextDisabled || isSubmitting"
      class="w-full text-sm md:text-xl font-bold uppercase h-10 md:h-16 rounded-full transition-colors flex items-center justify-center gap2 md:gap-4"
      :class="!isNextDisabled && !isSubmitting ? 'bg-accentColor1 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'">
      {{ nextText }}
      <svg class="w-[12px] md:w-[16px]" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.2643 8.70829H1.79135C1.44898 8.70829 1.1618 8.59229 0.929804 8.36029C0.697804 8.12829 0.582206 7.84151 0.583012 7.49995C0.583012 7.15759 0.699012 6.87041 0.931012 6.63841C1.16301 6.40641 1.44979 6.29081 1.79135 6.29162H15.2643L11.8205 2.84787C11.5788 2.6062 11.4628 2.32426 11.4725 2.00204C11.4822 1.67981 11.5982 1.39787 11.8205 1.1562C12.0622 0.914536 12.3494 0.788466 12.6821 0.777994C13.0147 0.767522 13.3015 0.883522 13.5424 1.12599L19.0705 6.65412C19.1913 6.77495 19.2771 6.90586 19.3279 7.04683C19.3786 7.1878 19.4036 7.33884 19.4028 7.49995C19.4028 7.66106 19.3774 7.81211 19.3267 7.95308C19.2759 8.09405 19.1905 8.22495 19.0705 8.34579L13.5424 13.8739C13.3007 14.1156 13.0139 14.2316 12.6821 14.2219C12.3502 14.2122 12.063 14.0862 11.8205 13.8437C11.599 13.602 11.483 13.3201 11.4725 12.9979C11.462 12.6756 11.578 12.3937 11.8205 12.152L15.2643 8.70829Z" fill="currentColor"/>
      </svg>
    </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  backText?: string
  nextText?: string
  isBackDisabled?: boolean
  isNextDisabled?: boolean
  isSubmitting?: boolean
}

interface Emits {
  (e: 'back'): void
  (e: 'next'): void
}

const props = withDefaults(defineProps<Props>(), {
  backText: 'Back',
  nextText: 'Next',
  isBackDisabled: false,
  isNextDisabled: false,
  isSubmitting: false
})

const emit = defineEmits<Emits>()

const handleBack = () => {
  emit('back')
}

const handleNext = () => {
  emit('next')
}
</script>