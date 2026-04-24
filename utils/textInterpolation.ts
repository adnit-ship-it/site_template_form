import type { FormAnswers } from "~/types/form";
import { calculatePaceValues, calculateMedicalValues, calculateMonthlyWeightLossRange, calculateMonthsToGoalWeight } from "./calculations";

function getOrgName(): string {
  try {
    return useRuntimeConfig().public.orgName as string || 'The Hormone Experts';
  } catch {
    return 'The Hormone Experts';
  }
}

export function interpolateText(text: string, formAnswers: FormAnswers): string {
  if (!text) return text;

  // Helper function to get field value directly (no more quiz prefixes)
  const getFieldValue = (baseId: string) => {
    return formAnswers[baseId] || null;
  };

  try {
    // Get the actual values using the helper function
    const weight = getFieldValue('weight');
    const goalWeight = getFieldValue('goalWeight');
  
    const feet = getFieldValue('feet');
    const inches = getFieldValue('inches');
    const firstName = getFieldValue('firstName');
    const lastName = getFieldValue('lastName');
    const email = getFieldValue('email');
    const phone = getFieldValue('phone');
    const gender = getFieldValue('gender');

    // Calculate dynamic values
      const paceValues = calculatePaceValues(weight);
  const medicalValues = calculateMedicalValues({ weight, feet, inches } as FormAnswers);
    const monthlyWeightLoss = calculateMonthlyWeightLossRange(weight);
    const monthsToGoal = calculateMonthsToGoalWeight(weight, goalWeight);
    
    // Calculate weight difference (current weight - goal weight)
    const weightDifference = (weight && goalWeight) ? (Number(weight) - Number(goalWeight)) : null;

    // Replace placeholders with calculated values
    const result = text
      // Pace-related placeholders
      .replace(/\{\{weeklyLossRange\}\}/g, paceValues.weeklyLossRange)
      .replace(/\{\{timeToGoal\}\}/g, paceValues.timeToGoal)

      // Monthly weight loss placeholders (15% and 20% annual)
      .replace(/\{\{monthlyWeightLossLower\}\}/g, monthlyWeightLoss.lower.toFixed(2))
      .replace(/\{\{monthlyWeightLossUpper\}\}/g, monthlyWeightLoss.upper.toFixed(2))

      // Months to goal weight (17% annual) - rounded to whole number
      .replace(/\{\{monthsToGoalWeight\}\}/g, Math.round(monthsToGoal).toString())
      
      // Medical-related placeholders
      .replace(/\{\{bmi\}\}/g, medicalValues.bmi)
      .replace(/\{\{currentWeight\}\}/g, medicalValues.currentWeight)
  
      .replace(/\{\{weeksToGoal\}\}/g, medicalValues.weeksToGoal)

      // Weight difference placeholder
      .replace(/\{\{currentWeight-goalWeight\}\}/g, weightDifference !== null ? Math.abs(weightDifference).toString() : '')
      
      // Form answer placeholders
      .replace(/\{\{weight\}\}/g, weight?.toString() || '')
      .replace(/\{\{goalWeight\}\}/g, goalWeight?.toString() || '')
  
      .replace(/\{\{firstName\}\}/g, firstName || '')
      .replace(/\{\{lastName\}\}/g, lastName || '')
      .replace(/\{\{email\}\}/g, email || '')
      .replace(/\{\{phone\}\}/g, phone || '')
      .replace(/\{\{gender\}\}/g, gender || '')
      .replace(/\{\{feet\}\}/g, feet?.toString() || '')
      .replace(/\{\{inches\}\}/g, inches?.toString() || '')

      .replace(/\{\{orgName\}\}/g, getOrgName())
      ;

    return result;
  } catch (error) {
    console.error('Error in text interpolation:', error);
    // Return original text if interpolation fails
    return text;
  }
}

export function interpolateFormStep(step: any, formAnswers: FormAnswers): any {
  if (!step) return step;

  // Interpolate step-level text
  const interpolatedStep = {
    ...step,
    title: step.title ? interpolateText(step.title, formAnswers) : step.title,
    heading: step.heading ? interpolateText(step.heading, formAnswers) : step.heading,
    heading1: step.heading1 ? interpolateText(step.heading1, formAnswers) : step.heading1,
    heading2: step.heading2 ? interpolateText(step.heading2, formAnswers) : step.heading2,
    subtext: step.subtext ? interpolateText(step.subtext, formAnswers) : step.subtext,
    dynamicSubtext: step.dynamicSubtext ? interpolateText(step.dynamicSubtext, formAnswers) : step.dynamicSubtext,
    dynamicTitle: step.dynamicTitle ? interpolateText(step.dynamicTitle, formAnswers) : step.dynamicTitle,
    dynamicHeading1: step.dynamicHeading1 ? interpolateText(step.dynamicHeading1, formAnswers) : step.dynamicHeading1,
    dynamicHeading2: step.dynamicHeading2 ? interpolateText(step.dynamicHeading2, formAnswers) : step.dynamicHeading2,
  };

  // Interpolate question-level text
  if (step.questions) {
    interpolatedStep.questions = step.questions.map((question: any) => {
      const interpolatedQuestion = { ...question };

      // Handle heading for PERFECT questions
      if (question.heading) {
        interpolatedQuestion.heading = interpolateText(question.heading, formAnswers);
      }

      // Handle question text (used by MARKETING and other components)
      if (question.question) {
        interpolatedQuestion.question = interpolateText(question.question, formAnswers);
      }
      
      // Handle dynamicSubtext for PERFECT questions
      if (question.dynamicSubtext) {
        interpolatedQuestion.dynamicSubtext = interpolateText(question.dynamicSubtext, formAnswers);
      }
      
      // Handle dynamicText for other question types
      if (question.dynamicText) {
        interpolatedQuestion.dynamicText = interpolateText(question.dynamicText, formAnswers);
      }
      
      return interpolatedQuestion;
    });
  }

  return interpolatedStep;
}
