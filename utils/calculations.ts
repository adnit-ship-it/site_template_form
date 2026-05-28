import type { FormAnswers } from "~/types/form";

export interface CalculatedValues {
  bmi: string;
  currentWeight: string;
  weeksToGoal: string;
}

export interface PaceValues {
  weeklyLossRange: string;
  timeToGoal: string;
}

// Constants for pace calculations - Realistic for GLP-1 medications
const LOWER_PERCENT_LOSS = 0.15; // 16% - typical GLP-1 weight loss
const UPPER_PERCENT_LOSS = 0.2; // 22% - upper range for GLP-1 medications
const WEEKS_IN_YEAR = 52;
const MONTHS_IN_YEAR = 12;

export function calculatePaceValues(
  currentWeight: number
): PaceValues {
  // Handle edge cases
  if (!currentWeight || currentWeight <= 0) {
    return {
      weeklyLossRange: "0.00 to 0.00",
      timeToGoal: "12",
    };
  }

  // Calculate total expected loss over a year
  const lowerBoundTotalLoss = currentWeight * LOWER_PERCENT_LOSS;
  const upperBoundTotalLoss = currentWeight * UPPER_PERCENT_LOSS;

  // Convert to weekly range
  const lowerBoundWeeklyLoss = lowerBoundTotalLoss / WEEKS_IN_YEAR;
  const upperBoundWeeklyLoss = upperBoundTotalLoss / WEEKS_IN_YEAR;

  return {
    weeklyLossRange: `${lowerBoundWeeklyLoss.toFixed(
      2
    )} to ${upperBoundWeeklyLoss.toFixed(2)}`,
    timeToGoal: "12", // Default 12 weeks timeline
  };
}

// Example: calculatePaceValues(220, 155) returns:
// { weeklyLossRange: "0.55 to 0.76", timeToGoal: "99" }

export function calculateMedicalValues(
  formAnswers: FormAnswers
): CalculatedValues {
  // Extract values from form answers
  const feet = formAnswers.feet;
  const inches = formAnswers.inches;
  const currentWeight = formAnswers.weight;

  // Handle edge cases
  if (feet == null || inches == null || currentWeight == null) {
    return {
      bmi: "0.00",
      currentWeight: "0LBS",
      weeksToGoal: "12.00",
    };
  }

  // Calculate height in inches
  const heightInInches = feet * 12 + inches;
  const heightInMeters = heightInInches * 0.0254;

  // Calculate weight in kg
  const weightInKg = currentWeight * 0.453592;

  // Calculate BMI: weight (kg) / height (m)²
  const bmi = weightInKg / (heightInMeters * heightInMeters);

  return {
    bmi: bmi.toFixed(2),
    currentWeight: `${currentWeight}LBS`,
    weeksToGoal: "12.00", // Default 12 weeks timeline
  };
}

/**
 * Calculate monthly weight loss range based on 15% (lower) and 20% (upper) annual weight loss
 * @param currentWeight - Current weight in pounds
 * @returns Object with lower and upper monthly weight loss values
 */
export function calculateMonthlyWeightLossRange(currentWeight: number | null | undefined): {
  lower: number;
  upper: number;
} {
  if (!currentWeight || currentWeight <= 0) {
    return { lower: 0, upper: 0 };
  }

  // 15% annual loss (lower end)
  const lowerAnnualLoss = currentWeight * 0.15;
  const lowerMonthlyLoss = lowerAnnualLoss / MONTHS_IN_YEAR;

  // 20% annual loss (upper end)
  const upperAnnualLoss = currentWeight * 0.20;
  const upperMonthlyLoss = upperAnnualLoss / MONTHS_IN_YEAR;

  return {
    lower: lowerMonthlyLoss,
    upper: upperMonthlyLoss,
  };
}

/**
 * Calculate months to reach goal weight based on 17% annual weight loss (middle of 15% and 20%)
 * @param currentWeight - Current weight in pounds
 * @param goalWeight - Goal weight in pounds
 * @returns Number of months to reach goal weight
 */
export function calculateMonthsToGoalWeight(
  currentWeight: number | null | undefined,
  goalWeight: number | null | undefined
): number {
  if (!currentWeight || !goalWeight || currentWeight <= 0 || goalWeight <= 0) {
    return 0;
  }

  // Calculate weight to lose
  const weightToLose = currentWeight - goalWeight;

  // If goal weight is higher than current weight, return 0
  if (weightToLose <= 0) {
    return 0;
  }

  // 17% annual loss (middle of 15% and 20%)
  const annualLossPercent = 0.17;
  const monthlyLoss = (currentWeight * annualLossPercent) / MONTHS_IN_YEAR;

  // Calculate months needed
  const monthsToGoal = weightToLose / monthlyLoss;

  return monthsToGoal;
}
