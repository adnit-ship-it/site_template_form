import { useState } from '#app';

/**
 * This composable holds the definition of our progress steps.
 * It's defined once and can be accessed from any component.
 */
export const useFormSteps = () => {
  return useState('formSteps', () => [
    { name: 'Start' },
    { name: 'Preliminary' },
    { name: 'Health' },
    { name: 'Details' },
    { name: 'Eligibility' },
  ]);
};

/**
 * This composable holds the CURRENT step number for the form.
 * It's the "shared whiteboard" that the layout and page both use.
 * It's initialized to 0 (the first step).
 */
export const useCurrentFormStep = () => {
  return useState('currentFormStep', () => 0);
};
