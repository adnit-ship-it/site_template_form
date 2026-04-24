<template>
  <div ref="stepContainer" class="w-full max-w-[668px] mx-auto">
    <!-- Weight Summary Display for personalInfo step - only on weight-loss quiz -->
    <WeightSummaryDisplay v-if="stepData.id === 'personalInfo' && selectedQuizId === 'weight-loss'" :formAnswers="formAnswers" />

    <!-- This container handles the overall styling for the question area -->
    <div class="relative lg:min-w-[668px] max-w-[668px]">
      <h2 v-if="stepData.title"
        class="font-semibold text-base md:text-left text-left font-bodyFont text-bodyColor mb-2 md:mb-3"
        :class="{ 'text-left': isMarketingOrBoxSelect }">
        {{ stepData.title }}
      </h2>

      <p v-if="stepData.questionSubtext" class="text-sm md:text-base text-left md:text-center">
        {{ stepData.questionSubtext }}
      </p>

      <!-- This grid handles the layout for steps with multiple questions -->
      <div class="grid gap-x-6 gap-y-4 pb-6 pt-4" :class="{
        'grid-cols-1': true,
        'md:grid-cols-1': questionsPerRow === 1,
        'md:grid-cols-2': questionsPerRow === 2 || !questionsPerRow,
        'md:grid-cols-3': questionsPerRow === 3,
        'md:grid-cols-4': questionsPerRow === 4,
      }">
        <div v-for="(question, index) in visibleQuestions" :key="question.id"
          :class="{ 'md:col-span-2': isFullWidth(question, index) }">
          <!-- Vue's dynamic component magic happens here -->
          <component :is="getComponentForQuestion(question)" :key="`${question.id}-${question.type}`"
            :question="question" :formAnswers="formAnswers" :stepQuestions="stepQuestions"
            v-model="formAnswers[question.id]" @autoAdvance="handleAutoAdvance" />
        </div>
      </div>

      <!-- Display calculated values (like BMI) -->
      <div v-if="displayValue" class="text-left">
        <p class="text-xl font-medium text-bodyColor">{{ displayValue }}</p>
      </div>

      <!-- Loading Overlay -->
      <div v-if="isLoading"
        class="absolute inset-0 bg-bodyColor bg-opacity-5 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
        <div class="flex flex-col items-center space-y-4">
          <!-- Spinner -->
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accentColor1"></div>
          <!-- Loading text -->
          <p class="text-bodyColor font-medium text-lg">Processing...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, type PropType } from 'vue'
import type { FormStep, FormQuestion, FormAnswers } from '~/types/form'
import WeightSummaryDisplay from './WeightSummaryDisplay.vue'
import { getComponentForQuestion } from '~/utils/componentMapper'
import { usePatientForm } from '~/composables/usePatientForm'

const { selectedQuizId } = usePatientForm()

const stepContainer = ref<HTMLElement | null>(null)

// --- PROPS ---
const props = defineProps({
  stepData: { type: Object as PropType<FormStep>, required: true },
  formAnswers: { type: Object as PropType<FormAnswers>, required: true },
  isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['autoAdvance'])

// Handle auto-advance from child components
const handleAutoAdvance = () => {
  emit('autoAdvance')
}

// Focus the first focusable input when the step changes
watch(() => props.stepData.id, async () => {
  await nextTick()
  if (!stepContainer.value) return
  const firstInput = stepContainer.value.querySelector<HTMLElement>(
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
  )
  firstInput?.focus()
})

// --- COMPUTED & HELPERS ---
const stepQuestions = computed(() => props.stepData.questions || [])

const questionsPerRow = computed(() => props.stepData.questionsPerRow ?? 2)

// Filter questions based on renderCondition
const visibleQuestions = computed(() => {
  return stepQuestions.value.filter((question) => {
    // If no renderCondition is provided, always show the question
    if (!question.renderCondition) {
      return true;
    }
    // Check if the condition is met
    return question.renderCondition(props.formAnswers);
  });
});

const isMarketingOrBoxSelect = computed(() => {
  const q = visibleQuestions.value[0]
  if (!q) return false
  if (q.type === 'MARKETING' || q.type === 'PERFECT' || q.type === 'BEFORE_AFTER') return true
  // return (q.type === 'SINGLESELECT' || q.type === 'MULTISELECT') && !q.displayAsRow
})

const isFullWidth = (question: FormQuestion, index: number) => {
  if (isMarketingOrBoxSelect.value || question.type === 'FILE_INPUT') return true
  // Only apply full-width logic when using 2 columns and there's an odd number of questions
  if (questionsPerRow.value === 2) {
    return visibleQuestions.value.length % 2 !== 0 && index === visibleQuestions.value.length - 1
  }
  return false
}

// Calculate and display computed values (like BMI)
const displayValue = computed(() => {
  if (!props.stepData.displayValue) return null

  const { condition, calculate, template } = props.stepData.displayValue

  // Check if condition is met
  if (!condition(props.formAnswers)) return null

  // Calculate the value
  const calculatedValue = calculate(props.formAnswers)

  // Replace {{value}} placeholder with calculated value
  return template.replace('{{value}}', calculatedValue.toString())
})
</script>