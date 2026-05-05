export interface FormAnswers {
  [key: string]: any;
}

// Options can be a plain string or a rich object with label + image
export interface SelectOptionObject {
  label: string;
  img?: string;
}

export type SelectOption = string | SelectOptionObject;

// Helpers to normalise SelectOption → label / img regardless of format
export function getOptionLabel(option: SelectOption): string {
  return typeof option === 'string' ? option : option.label;
}

export function getOptionImg(option: SelectOption): string | undefined {
  return typeof option === 'string' ? undefined : option.img;
}

// Validation rule interface
export interface ValidationRule {
  type:
    | "required"
    | "email"
    | "phone"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "custom";
  message: string;
  value?: any; // For minLength, maxLength, pattern, etc.
  validator?: (value: any, formAnswers?: any) => boolean; // For custom validation with optional formAnswers
}

// A discriminated union for our flexible question/input types.
export type FormQuestion =
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required: boolean;
      type: "text" | "textarea" | "number" | "email" | "tel";
      inputmode?: "numeric" | "decimal" | "tel" | "email" | "url" | "search" | "none";
      placeholder?: string;
      apiType: "TEXT";
      dynamicText?: string;
      validation?: ValidationRule[];
      icon?: string;
      minValue?: number;
      maxValue?: number;
      maxLength?: number;
      numbersOnly?: boolean;
      renderCondition?: (answers: FormAnswers) => boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required: boolean;
      type: "DROPDOWN";
      options: (string | number)[] | ((answers: any) => (string | number)[]);
      optionLabels?: string[];
      apiType: "TEXT" | "DATE";
      dynamicText?: string;
      validation?: ValidationRule[];
      renderCondition?: (answers: FormAnswers) => boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required: boolean;
      type: "SINGLESELECT" | "MULTISELECT" | "CHECKBOX";
      options: SelectOption[];
      displayAsRow?: boolean;
      optionRowLayout?: [number, number]; // [mobile, desktop] - number of options per row
      apiType: "SINGLESELECT" | "MULTISELECT";
      dynamicText?: string;
      validation?: ValidationRule[];
      image?: string;
      renderCondition?: (answers: FormAnswers) => boolean;
      startValue?: boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required: boolean;
      type: "YESNO";
      options: SelectOption[];
      apiType: "SINGLESELECT";
      dynamicText?: string;
      validation?: ValidationRule[];
      image?: string;
      renderCondition?: (answers: FormAnswers) => boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required?: false;
      type: "MARKETING";
      image?: string;
      dynamicText?: string;
      validation?: ValidationRule[];
      displayStatistics?: boolean;
      renderCondition?: (answers: FormAnswers) => boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required?: false;
      type: "BEFORE_AFTER";
      beforeImage?: string;
      afterImage?: string;
      image?: string; // Alternative to beforeImage/afterImage for single image display
      quote?: string;
      dynamicText?: string;
      validation?: ValidationRule[];
      renderCondition?: (answers: FormAnswers) => boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required: boolean;
      type: "FILE_INPUT";
      apiType: "FILE";
      dynamicText?: string;
      validation?: ValidationRule[];
      renderCondition?: (answers: FormAnswers) => boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required: boolean;
      type: "MEDICAL_REVIEW";
      calculatedValues?: {
        bmi?: string;
        currentWeight?: string;
      
        weeksToGoal?: string;
      };
      candidateStatement: string;
      renderCondition?: (answers: FormAnswers) => boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required: boolean;
      type: "PERFECT";
      heading?: string;
      dynamicSubtext?: string;
      subtext?: string;
      renderCondition?: (answers: FormAnswers) => boolean;
    }
  | {
      id: string;
      question?: string;
      displayQuestion?: string;
      required: boolean;
      type: "WEIGHT_SUMMARY";
      renderCondition?: (answers: FormAnswers) => boolean;
    };

// Display value interface for calculated values
export interface DisplayValue {
  condition: (answers: FormAnswers) => boolean;
  calculate: (answers: FormAnswers) => string | number;
  template: string;
}

// Defines the structure of a single step/page in the form.
export interface FormStep {
  id: string; // Unique ID for each step
  title?: string;
  questionSubtext?: string;
  questions: FormQuestion[];
  heading?: string;
  subtext?: string;
  image?: string; // Optional image to display above the header
  renderCondition?: (answers: FormAnswers) => boolean;
  questionsPerRow?: number; // Number of questions to display per row (default: 2)
  // Support for dynamic text in titles and headings
  dynamicTitle?: string;
  dynamicHeading1?: string;
  dynamicHeading2?: string;
  dynamicSubtext?: string;
  // Optional field to show trust badges at the bottom
  showTrustBadges?: boolean;
  // Optional field to render headings inline (without line break)
  headingsInline?: boolean;
  // Optional field for displaying calculated values
  displayValue?: DisplayValue;
}

// Progress step interface for the progress bar
export interface ProgressStep {
  id: string;
  name: string;
  description: string;
}

// Step progress mapping interface
export interface StepProgressMapping {
  stepId: string;
  progressStepId: string;
}

// Quiz configuration interface
export interface QuizConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  progressSteps: ProgressStep[];
  stepProgressMapping: StepProgressMapping[];
  steps: FormStep[];
  metadata?: {
    category: string;
    estimatedTime: string;
    targetAudience: string;
    compliance: string[];
  };
}
