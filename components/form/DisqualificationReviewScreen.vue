<template>
  <div class="w-full max-w-[800px] mx-auto px-3 lg:px-4 py-4 lg:py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-bodyColor mb-4">
        Please Review Your Answers
      </h1>
      <p class="text-base md:text-lg text-bodyColor/80">
        Some of the conditions you selected may prevent you from receiving GLP-1 treatment. 
        If you accidentally selected a condition that doesn't apply to you, please review and 
        update your answers below.
      </p>
    </div>

    <!-- Questions to Review -->
    <div class="space-y-6">
      <div 
        v-for="field in disqualifyingFields" 
        :key="field.fieldName"
        class="bg-gray-50 rounded-lg p-3 lg:p-6 border-2 border-orange-200"
      >
        <template v-if="getStepDataForField(field.fieldName)">
          <FormStepLayout 
            :step-data="getStepDataForField(field.fieldName)!"
            :form-answers="formAnswers"
            :is-loading="isLoading"
            class="review-question"
          />
        </template>
        
        <!-- Show which answers are problematic -->
        <div class="mt-4 p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
          <p class="font-semibold mb-1">⚠️ Concerning answers:</p>
          <ul class="list-disc list-inside">
            <li v-for="selection in field.disqualifyingSelections" :key="selection">
              {{ selection }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex flex-col sm:flex-row gap-4 mt-8">
      <!-- Back Button -->
      <button
        @click="handleBack"
        :disabled="isLoading"
        class="flex-1 px-6 py-3 border-2 border-gray-300 text-bodyColor font-semibold rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Back to Quiz
      </button>

      <!-- Continue Button -->
      <button
        @click="handleContinue"
        :disabled="isLoading"
        class="flex-1 px-6 py-3 font-semibold rounded-full transition-colors"
        :class="!isLoading 
          ? 'bg-accentColor1 text-white hover:bg-accentColor1/90' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
      >
        {{ isLoading ? 'Processing...' : 'Continue' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { FormStep, QuizConfig } from '~/types/form';
import { getQuizById } from '~/data/quizConfigs';

const props = defineProps<{
  disqualifyingFields: Array<{ fieldName: string; disqualifyingSelections: string[] }>;
  formAnswers: Record<string, any>;
  isLoading: boolean;
  selectedQuiz: string;
}>();

const emit = defineEmits<{
  continue: [];
  back: [];
}>();

const quizConfig = ref<QuizConfig | null>(null);

onMounted(async () => {
  quizConfig.value = (await getQuizById(props.selectedQuiz)) ?? null;
});

const findQuestionByFieldName = (fieldName: string) => {
  if (!quizConfig.value) return null;

  for (const step of quizConfig.value.steps) {
    const question = step.questions.find((q: any) => q.id === fieldName);
    if (question) {
      return { step, question };
    }
  }
  return null;
};

const getStepDataForField = (fieldName: string): FormStep | null => {
  const found = findQuestionByFieldName(fieldName);
  if (!found) return null;

  return {
    id: `review-${fieldName}`,
    heading: found.step.heading || '',
    questions: [found.question]
  } as FormStep;
};

const handleContinue = () => {
  emit('continue');
};

const handleBack = () => {
  emit('back');
};
</script>

<style scoped>
/* Highlight review questions */
.review-question :deep(.question-label) {
  font-weight: 600;
  margin-bottom: 0.5rem;
}
</style>
