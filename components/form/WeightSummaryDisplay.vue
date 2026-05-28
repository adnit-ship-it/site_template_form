<template>
  <div class="mb-8">
    <div class="flex flex-col gap-2">
      <div class="text-bodyColor"><b>BMI:</b> {{ bmi }}</div>
      <div class="text-bodyColor"><b>Current Weight:</b> {{ currentWeight }}lbs</div>
      <div v-if="goalWeight && monthsToGoal" class="text-bodyColor"><b>Goal Weight:</b> {{ goalWeight }}lbs within {{ monthsToGoal }} months</div>
      <div v-else-if="goalWeight" class="text-bodyColor"><b>Goal Weight:</b> {{ goalWeight }}lbs</div>
      <p class="text-bodyColor">You are a <span class="font-bold text-bodyColor">strong candidate</span> for medical
        weight loss with a <span class="font-bold text-bodyColor">94% chance</span> chance of successful treatment if
        qualified.</p>
      <hr>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FormAnswers } from '~/types/form'
import { calculateMonthsToGoalWeight } from '~/utils/calculations'

// --- PROPS ---
const props = defineProps<{
  formAnswers: FormAnswers
}>()

// --- COMPUTED PROPERTIES ---
const currentWeight = computed(() => {
  return props.formAnswers.weight || '--'
})

const goalWeight = computed(() => {
  return props.formAnswers.goalWeight || null
})

const monthsToGoal = computed(() => {
  const current = props.formAnswers.weight
  const goal = props.formAnswers.goalWeight

  if (!current || !goal) return null

  const months = calculateMonthsToGoalWeight(current, goal)
  return months > 0 ? Math.ceil(months) : null
})

const bmi = computed(() => {
  const feet = props.formAnswers.feet
  const inches = props.formAnswers.inches
  const weight = props.formAnswers.weight

  if (feet == null || inches == null || weight == null) return '--'

  // Convert height from feet/inches to inches
  const heightInInches = (feet * 12) + inches
  const heightInMeters = heightInInches * 0.0254
  const weightInKg = weight * 0.453592 // Convert lbs to kg

  // Calculate BMI: weight (kg) / height (m)²
  const bmiValue = weightInKg / (heightInMeters * heightInMeters)

  return bmiValue.toFixed(1)
})

</script>