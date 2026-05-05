<template>
  <div class="bg-gray-50 p-6 rounded-lg">
    <h3 class="text-lg font-semibold mb-4">Weight Loss Summary</h3>
    <div class="grid grid-cols-2 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">{{ weightToLose }} lbs</div>
        <div class="text-sm text-gray-600">to lose</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{{ weeksToGoal }}</div>
        <div class="text-sm text-gray-600">weeks to goal</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormQuestion } from '~/types/form';

interface Props {
  question: FormQuestion & { type: 'WEIGHT_SUMMARY' };
  formAnswers: Record<string, any>;
}

const props = defineProps<Props>();

const weightToLose = computed(() => {
  const current = props.formAnswers.weight;
  return current ? current : 0;
});

const weeksToGoal = computed(() => {
  // Calculate based on your logic
  return Math.ceil(weightToLose.value / 2); // Assuming 2 lbs per week
});
</script> 