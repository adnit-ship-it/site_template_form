import type { FormQuestion } from "~/types/form";

// Import all the form input components
import FormInputsTextInput from "~/components/form/inputs/TextInput.vue";
import FormInputsTextarea from "~/components/form/inputs/Textarea.vue";
import FormInputsDropdown from "~/components/form/inputs/Dropdown.vue";
import FormInputsSelect from "~/components/form/inputs/Select.vue";
import FormInputsCheckbox from "~/components/form/inputs/Checkbox.vue";
import FormInputsMarketing from "~/components/form/inputs/Marketing.vue";
import FormInputsBeforeAfter from "~/components/form/inputs/BeforeAfter.vue";
import FormInputsFileInput from "~/components/form/inputs/FileInput.vue";
import FormInputsYesNoButtons from "~/components/form/inputs/YesNoButtons.vue";
import FormInputsMedicalReview from "~/components/form/inputs/MedicalReview.vue";
import FormInputsPerfect from "~/components/form/inputs/Perfect.vue";
import FormInputsWeightSummary from "~/components/form/WeightSummaryDisplay.vue";

// Component mapping registry
const componentMap: Record<string, any> = {
  text: FormInputsTextInput,
  textarea: FormInputsTextarea,
  number: FormInputsTextInput,
  email: FormInputsTextInput,
  tel: FormInputsTextInput,
  DROPDOWN: FormInputsDropdown,
  SINGLESELECT: FormInputsSelect,
  MULTISELECT: FormInputsSelect,
  CHECKBOX: FormInputsCheckbox,
  MARKETING: FormInputsMarketing,
  BEFORE_AFTER: FormInputsBeforeAfter,
  FILE_INPUT: FormInputsFileInput,
  YESNO: FormInputsYesNoButtons,
  MEDICAL_REVIEW: FormInputsMedicalReview,
  PERFECT: FormInputsPerfect,
  WEIGHT_SUMMARY: FormInputsWeightSummary,
};

/**
 * Determines which component to use for a given question
 * @param question - The form question to get a component for
 * @returns The Vue component to render
 */
export function getComponentForQuestion(question: FormQuestion) {
  return (
    componentMap[question.type] || componentMap["text"] || FormInputsTextInput
  );
}

/**
 * Registers a new component type
 * @param type - The question type
 * @param component - The Vue component to use
 */
export function registerComponent(type: string, component: any) {
  componentMap[type] = component;
}

/**
 * Gets all registered component types
 * @returns Array of registered component types
 */
export function getRegisteredTypes(): string[] {
  return Object.keys(componentMap);
}
