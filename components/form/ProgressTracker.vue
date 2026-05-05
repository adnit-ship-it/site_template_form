<template>
  <div class="w-full">
    <div class="w-full flex items-center h-full font-bodyFont pb-4 md:pb-6 border-b border-bodyColor">
      <template v-for="(step, index) in steps" :key="step.name">
        <div class="flex items-center flex-shrink-0">
          <!-- Completed step: show checkmark icon that fills the whole circle -->
          <div v-if="index < currentStepIndex" class="w-4 h-4 md:w-6 md:h-6 flex items-center justify-center transition-all duration-300">
            <img 
              src="/assets/images/brand/check-alt.svg" 
              alt="Completed" 
              class="w-full h-full" />
          </div>
          <!-- Current or future step: show circle with dot or empty -->
          <div v-else
            class="w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center bg-white border md:border-2 transition-colors duration-300"
            :class="index === currentStepIndex ? 'border-accentColor1' : 'border-bodyColor'">
            <!-- Blue dot for current step -->
            <div v-if="index === currentStepIndex" class="w-2 md:w-3 h-2 md:h-3 rounded-full bg-accentColor1"></div>
          </div>

          <span class="ml-1 md:ml-2 font-bodyFont text-xs md:text-base font-semibold whitespace-nowrap" :class="[
            index <= currentStepIndex ? 'text-accentColor1' : 'text-bodyColor'
          ]">
            {{ step.name }}
          </span>
        </div>

        <div v-if="index < steps.length - 1" class="flex-auto h-[1px] md:h-0.5 ml-1 md:ml-4 transition-colors duration-500"
          :class="index < currentStepIndex ? 'bg-accentColor1' : 'bg-bodyColor'"></div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Step {
  name: string;
}

const props = defineProps<{
  steps: Step[];
  currentStep: number; // 0-indexed current step
}>();

const currentStepIndex = computed(() => {
  return Math.max(0, Math.min(props.currentStep, props.steps.length - 1));
});
</script>

<style scoped></style>