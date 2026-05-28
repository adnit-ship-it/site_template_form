<template>
  <div class="text-bodyColor flex flex-col gap-5">
    <p class="text-[32px]/[40px]">Perfect!</p>
    <h2 class="text-[24px]/[30px] mb-4" v-html="question.heading || 'Perfect!'">
    </h2>
    <p class="text-bodyColor font-semibold" v-if="question.question">
      {{ question.question }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { FormQuestion } from '~/types/form';

interface Props {
  question: FormQuestion & { type: 'PERFECT' };
  formAnswers: Record<string, any>;
}

const props = defineProps<Props>();
</script>