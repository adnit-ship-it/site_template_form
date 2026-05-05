import type { FormStep } from "~/types/form";
import common from "~/data/common.json";
import type { CommonData } from "~/data/common-helpers";

const orgName = (common as CommonData).brand?.orgName || "The Hormone Experts";

// --- FORM STRUCTURE DATA ---
// GLP-1 Weight Loss Form Steps
export const glp1Steps: FormStep[] = [
  {
    id: "heightWeight",
    heading: "Reach your goal weight fast without restrictive diets and exercise.",
    subtext: "Let's calculate your BMI to make sure you're a good candidate for medical weight loss.",
    image: "/assets/images/quiz/template-quiz-images/step1.jpg",
    title: "What is your height and weight?",
    displayValue: {
      condition: (answers: any) => answers.feet != null && answers.inches != null && answers.weight != null,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "BMI: {{value}}"
    },
    questions: [
      {
        id: "feet",
        question: "Height (feet)",
        type: "number",
        required: true,
        maxValue: 8,
        minValue: 3,
        maxLength: 1,
        numbersOnly: true,
        placeholder: "E.g. 5",
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Height (inches)",
        type: "number",
        required: true,
        maxValue: 11,
        maxLength: 2,
        minValue: 0,
        numbersOnly: true,
        placeholder: "E.g. 2",
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (pounds)",
        type: "number",
        required: true,
        placeholder: "E.g 310",
        apiType: "TEXT",
      },
    ],
  },

  // Question 1: Weight Loss Goals
  {
    id: "goalWeight",
    heading: "Together, we'll reach the results you're aiming for.",
    questions: [
      {
        id: "goalWeight",
        type: "text",
        question: "What is your goal weight?",
        placeholder: "250",
        required: true,
        apiType: "TEXT",
        validation: [
          {
            type: "custom",
            message: "Your goal weight must be less than or equal to your current weight.",
            validator: (value: any, formAnswers?: any) => {
              if (!value || !formAnswers) return true; // Skip validation if value or formAnswers is missing
              const goalWeight = Number(value);
              const currentWeight = Number(formAnswers.weight);
              // If either value is not a valid number, skip validation
              if (isNaN(goalWeight) || isNaN(currentWeight) || !currentWeight) return true;
              return goalWeight <= currentWeight;
            },
          },
        ],
      },
    ],
  },
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },
  {
    id: "pregnancyStatus",
    renderCondition: (answers: any) => answers.gender === "Female",
    heading: "Safety, first.",
    questionsPerRow: 1,
    questions: [
      {
        id: "pregnancyStatus",
        displayAsRow: true,
        question: "Any pregnancy-related conditions we should know about?",
        displayQuestion: "Do any of these apply to you?",
        type: "MULTISELECT",
        options: ["Currently or possibly pregnant", "Breastfeeding or bottle-feeding with breastmilk", "Have given birth to a child within the last 6 months", "None of the above"],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },

  // Question 2: Weight Loss Initiatives
  {
    id: "priority",
    heading: "Select the area that’s most important to you — we can help with all of them.",
    questions: [
      {
        id: "priority",
        type: "SINGLESELECT",
        question: "Which of these is your priority?",
        options: [
          { label: "Lose Weight", img: "/assets/images/quiz/scale.png" },
          { label: "Gain Muscle", img: "/assets/images/quiz/muscle.png" },
          { label: "Maintain My Current Body", img: "/assets/images/quiz/ok.png" },
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "marketing1",
    heading: "Powered by real metabolic science.",
    questions: [
      {
        id: "marketing1",
        type: "MARKETING",
        question: `Our patients see an average weight loss of <b>more than 20%</b>.<br /><br />
                  With GLP-1 medications, you're backed by one of the <b>most effective treatments available</b>—designed to help you reach your {{goalWeight}}-pound goal.`,
        image: "assets/images/quiz/template-quiz-images/science.png"
      },
    ]
  },
  {
    id: "quote1",
    heading: "&quot;Enjoyed the ability to speak with a medical professional who is supportive and informative.&quot;",
    questions: [
      {
        id: "quote1",
        type: "BEFORE_AFTER",
        displayQuestion: " ",
        question: "",
        image: "assets/images/quiz/beforeafter1.png"
      },
    ]
  },
  {
    id: "marketing2",
    heading: "GLP-1’s help you reach your goals.",
    questions: [
      {
        id: "marketing2",
        type: "MARKETING",
        question: `Weeks 1–4: Your system acclimates to GLP-1 therapy.<br />
                    Weeks 4–8: Weight loss picks up momentum.<br />
                    Week 9+: Your body is operating in full fat-burn mode.<br /><br />
                    At ${orgName}, we address the true drivers of your metabolic issues so you can experience lasting results—not another short-term quick fix.`,
        image: "assets/images/quiz/template-quiz-images/marketing2.png"
      },
    ]
  },


  // Question 5: Current GLP-1 Medications
  {
    id: "motivation",
    heading: "Creating real change starts with motivation.",
    questions: [
      {
        id: "motivation",
        question: "What is your primary reason for taking weight loss seriously?",
        type: "SINGLESELECT",
        options: ["I want to live longer", "I want to feel and look better", "I want to reduce current health issues", "All of these"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "pace",
    heading: "With medication, you'll lose {{monthlyWeightLossLower}} to<br />{{monthlyWeightLossUpper}} pounds per month.",
    subtext: "It will take about {{monthsToGoalWeight}} months to reach your goal weight of {{goalWeight}}lbs.",
    questions: [
      {
        id: "pace",
        question: "How is that pace for you?",
        type: "SINGLESELECT",
        options: [
          { label: "That works for me", img: "/assets/images/quiz/check.png" },
          { label: "I want it faster", img: "/assets/images/quiz/run.png" },
          { label: "That's too fast", img: "/assets/images/quiz/hourglass.png" },
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "perfect",
    questions: [
      {
        id: "perfect",
        type: "PERFECT",
        heading: "Losing {{currentWeight-goalWeight}}lbs is easier than you think - and it doesn’t involve restrictive diets.",
        question: `Now, let’s analyze your metabolism and discover how well your body processes macronutrients.`,
        required: false,
      },
    ]
  },
  {
    id: "sleepHabits",
    heading: "Sleep habits help us understand your body’s overall efficiency.",
    questions: [
      {
        id: "sleepHabits",
        question: "How is your sleep, overall?",
        type: "SINGLESELECT",
        options: [
          { label: "Pretty Good", img: "/assets/images/quiz/sleep-well.png" },
          { label: "A bit restless", img: "/assets/images/quiz/sleep-ok.png" },
          { label: "I don't sleep well", img: "/assets/images/quiz/sleep-bad.png" },
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "sleepHabitsTime",
    heading: "Sleep habits help us understand your body’s overall efficiency.",
    questions: [
      {
        id: "sleepHabitsTime",
        question: "How many hours of sleep do you usually get each night?",
        type: "SINGLESELECT",
        options: ["Less than 5 hours", "6-7 hours", "8-9 hours", "More than 9 hours"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "quote2",
    heading: "&quot;Excellent! Compassionate, knowledgeable, friendly, and answered all of my questions. The process went smoothly and as expected.&quot;",
    questions: [
      {
        id: "quote2",
        type: "BEFORE_AFTER",
        image: "assets/images/before-after/beforeafter2.jpg"
      },
    ]
  },
  {
    id: "medicalConditions1",
    heading: "GLP-1 is safe, though there are some health factors that may limit your ability to receive it.",
    questions: [
      {
        id: "medicalConditions1",
        type: "MULTISELECT",
        displayQuestion: "Do any of these apply to you?",
        question: "Which of these medical conditions apply to you?",
        options: [
          "None of these",
          "Hypertension (high blood pressure)",
          "High cholesterol",
          "Type 2 Diabetes (on insulin or sulfonylureas)",
          "Type 1 diabetes",
          "Obstructive sleep apnea",
          "Gout",
          "Metabolic syndrome",
          "Heart disease, stroke, or peripheral vascular disease",
          "Heart Failure",
          "Atrial fibrillation or flutter",
          "Tachycardia or fast heart rate",
          "Any ECG abnormality or heart rhythm abnormality",
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },

  // Question 13: Medical Conditions 2
  {
    id: "medicalConditions2",
    heading: "A few more health questions",
    questions: [
      {
        id: "medicalConditions2",
        type: "MULTISELECT",
        displayQuestion: "Do any of these apply to you?",
        question: "Which of these medical conditions apply to you?",
        options: [
          "None of these",
          "Gallbladder disease",
          "Fatty Liver (MASLD or MASH)",
          "Cirrhosis or end-stage liver disease",
          "End-stage kidney disease (on or about to be on dialysis)",
          "Chronic Kidney Disease Stage 3 or greater",
          "Hypothyroidism",
          "History of or current pancreatitis",
          "Current suicidal thoughts or prior suicide attempt",
          "Diabetic retinopathy (diabetic eye disease), damage to the optic nerve from trauma or reduced blood flow, or blindness",
          "Hyperthyroidism, or Thyroid Issues",
          "On blood thinners/warfarin",
          "Cancer (active diagnosis, active treatment, or in remission or cancer-free for less than 5 continuous years - does not apply to non-melanoma skin cancer that was considered cured via simple excision)"
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "currentGlp1",
    heading: "Have you taken medication for weight loss within the past 4 weeks?",
    questions: [
      {
        id: "currentGlp1",
        displayQuestion: "This helps us understand your current treatment status",
        question: "Currently taking GLP-1 Medications",
        type: "SINGLESELECT",
        options: ["Yes, I've taken GLP-1 medication", "Yes, I've taken a different medication for weight loss", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "currentGlp1Type",
    heading: "Which GLP-1 medication are you currently taking?",
    renderCondition: (answers: any) => answers.currentGlp1 === "Yes, I've taken GLP-1 medication",
    questions: [
      {
        id: "currentGlp1Type",
        type: "SINGLESELECT",
        question: "Current GLP-1 Medication",
        displayQuestion: "Please specify your current medication",
        options: [
          "Compounded Semaglutide",
          "Compounded Tirzepatide",
          "Mounjaro",
          "Wegovy",
          "Zepbound",
          "Ozempic"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "lastDoseDate",
    heading: "When was your last dose?",
    renderCondition: (answers: any) => answers.currentGlp1 === "Yes, I've taken GLP-1 medication",
    questions: [
      {
        id: "lastDoseDate",
        type: "SINGLESELECT",
        question: "When was your last dose?",
        displayQuestion: "Select the timeframe",
        options: [
          "0-7 Days",
          "8-14 Days",
          "More than 2 weeks but within the last month",
          "Over a month ago"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  // Split lastDoseStrength into 6 separate steps for each medication type
  {
    id: "lastDoseStrengthCompoundedSemaglutide",
    heading: "What was the strength of your last dose?",
    renderCondition: (answers: any) =>
      answers.currentGlp1 === "Yes, I've taken GLP-1 medication" &&
      answers.currentGlp1Type === "Compounded Semaglutide",
    questions: [
      {
        id: "lastDoseStrengthCompoundedSemaglutide",
        type: "SINGLESELECT",
        question: "Last Dose Strength",
        displayQuestion: "Please provide strength in milligrams (mg) if known",
        options: [
          "0.25 mg per week",
          "0.50 mg per week",
          "1.00 mg per week",
          "1.50 mg per week",
          "2.50 mg per week"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "lastDoseStrengthWegovy",
    heading: "What was the strength of your last dose?",
    renderCondition: (answers: any) =>
      answers.currentGlp1 === "Yes, I've taken GLP-1 medication" &&
      answers.currentGlp1Type === "Wegovy",
    questions: [
      {
        id: "lastDoseStrengthWegovy",
        type: "SINGLESELECT",
        question: "Last Dose Strength",
        displayQuestion: "Please provide strength in milligrams (mg) if known",
        options: [
          "0.25 mg",
          "0.5 mg",
          "1.0 mg",
          "1.7 mg",
          "2.4 mg"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "lastDoseStrengthOzempic",
    heading: "What was the strength of your last dose?",
    renderCondition: (answers: any) =>
      answers.currentGlp1 === "Yes, I've taken GLP-1 medication" &&
      answers.currentGlp1Type === "Ozempic",
    questions: [
      {
        id: "lastDoseStrengthOzempic",
        type: "SINGLESELECT",
        question: "Last Dose Strength",
        displayQuestion: "Please provide strength in milligrams (mg) if known",
        options: [
          "0.25 mg",
          "0.5 mg",
          "1.0 mg",
          "2.0 mg"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "lastDoseStrengthCompoundedTirzepatide",
    heading: "What was the strength of your last dose?",
    renderCondition: (answers: any) =>
      answers.currentGlp1 === "Yes, I've taken GLP-1 medication" &&
      answers.currentGlp1Type === "Compounded Tirzepatide",
    questions: [
      {
        id: "lastDoseStrengthCompoundedTirzepatide",
        type: "SINGLESELECT",
        question: "Last Dose Strength",
        displayQuestion: "Please provide strength in milligrams (mg) if known",
        options: [
          "2.5 mg",
          "5.0 mg",
          "7.5 mg",
          "10.0 mg",
          "12.5 mg",
          "15.0 mg"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "lastDoseStrengthMounjaro",
    heading: "What was the strength of your last dose?",
    renderCondition: (answers: any) =>
      answers.currentGlp1 === "Yes, I've taken GLP-1 medication" &&
      answers.currentGlp1Type === "Mounjaro",
    questions: [
      {
        id: "lastDoseStrengthMounjaro",
        type: "SINGLESELECT",
        question: "Last Dose Strength",
        displayQuestion: "Please provide strength in milligrams (mg) if known",
        options: [
          "2.5 mg",
          "5.0 mg",
          "7.5 mg",
          "10.0 mg",
          "12.5 mg",
          "15.0 mg"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "lastDoseStrengthZepbound",
    heading: "What was the strength of your last dose?",
    renderCondition: (answers: any) =>
      answers.currentGlp1 === "Yes, I've taken GLP-1 medication" &&
      answers.currentGlp1Type === "Zepbound",
    questions: [
      {
        id: "lastDoseStrengthZepbound",
        type: "SINGLESELECT",
        question: "Last Dose Strength",
        displayQuestion: "Please provide strength in milligrams (mg) if known",
        options: [
          "2.5 mg",
          "5.0 mg",
          "7.5 mg",
          "10.0 mg",
          "12.5 mg",
          "15.0 mg"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "dosagePreference",
    heading: "What dosage would you like to continue with?",
    renderCondition: (answers: any) => answers.currentGlp1 === "Yes, I've taken GLP-1 medication",
    questions: [
      {
        id: "dosagePreference",
        type: "SINGLESELECT",
        question: "Dosage Preference",
        displayQuestion: "Select your preferred dosage adjustment",
        options: ["Decrease Dose", "Stay the Same", "Increase Dose"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },

  // Question 9: Pregnancy Status
  {
    id: "opiates",
    heading: "Within the last 3 months, have you taken opiate pain medications and/or opiate-based street drugs?",
    questionsPerRow: 1,
    questions: [
      {
        id: "opiates",
        displayQuestion: " ",
        question: "Opiates",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "opiatesInfo",
        renderCondition: (answers: any) => answers.opiates === "Yes",
        question: "Give more details",
        type: "textarea",
        required: false,
        placeholder: "",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "weightLossSurgery",
    heading: "Have you had prior weight loss surgeries?",
    questionsPerRow: 1,
    questions: [
      {
        id: "weightLossSurgery",
        displayQuestion: " ",
        question: "Weight Loss Surgery",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "weightLossSurgeryInfo",
        renderCondition: (answers: any) => answers.weightLossSurgery === "Yes",
        question: "Give more details about your weight loss surgery",
        displayQuestion: "Give more details",
        type: "textarea",
        required: false,
        placeholder: "",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "weightLossPrograms",
    heading: "How about weight loss programs?",
    questionsPerRow: 1,
    questions: [
      {
        id: "weightLossPrograms",
        displayQuestion: " ",
        question: "Weight Loss Programs",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "weightLossProgramsInfo",
        renderCondition: (answers: any) => answers.weightLossPrograms === "Yes",
        question: "Give more details about your weight loss programs",
        displayQuestion: "Give more details",
        type: "textarea",
        required: false,
        placeholder: "",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "clinicallyAppropriate",
    heading: "If clinically appropriate, are you willing to:",
    questions: [
      {
        id: "clinicallyAppropriate",
        question: "If clinically appropriate, are you willing to:",
        displayQuestion: " ",
        type: "MULTISELECT",
        options: ["Reduce your caloric intake alongside medication", "Increase your physical activity alongside medication", "None of the above"],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "weightChangeLastYear",
    heading: "Has your weight changed in the last year?",
    questions: [
      {
        id: "weightChangeLastYear",
        question: "Has your weight changed in the last year?",
        displayQuestion: " ",
        type: "SINGLESELECT",
        options: ["Lost a significant amount", "Lost a little", "About the same", "Gained a little", "Gained a significant amount"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "quote3",
    heading: "&quot;Very attentive, I am grateful for the support with my treatment and the instructions; I am truly happy to receive this support.&quot;",
    questions: [
      {
        id: "quote3",
        type: "BEFORE_AFTER",
        image: "assets/images/before-after/beforeafter3.jpg"
      },
    ]
  },
  {
    id: "avgBloodPressure",
    heading: "What is your average blood pressure range?",
    questions: [
      {
        id: "avgBloodPressure",
        question: "What is your average blood pressure range?",
        displayQuestion: " ",
        type: "SINGLESELECT",
        options: ["<120/80 (Normal)", "120-129/<80 (Elevated)", "130-139/80-89 (High Stage 1)", "≥140/90 (High Stage 2)"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "avgHeartRate",
    heading: "How about your average resting heart rate?",
    questions: [
      {
        id: "avgHeartRate",
        question: "How about your average resting heart rate?",
        displayQuestion: " ",
        type: "SINGLESELECT",
        options: ["<60 beats per minute (Slow)", "60-100 beats per minute (Normal)", "101-110 beats per minute (Slightly Fast)", ">110 beats per minute (Fast)"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "findTreatment",
    heading: "You’re all set! Now let’s match you with the right treatment.",
    questionsPerRow: 1,
    questions: [
      {
        id: "findTreatment",
        type: "SINGLESELECT",
        question: "Which of these factors are most important to you?",
        displayQuestion: "Do any of these apply to you?",
        options: [
          { label: "Affordability (Lowest price)", img: "/assets/images/quiz/affordability.png" },
          { label: "Potency (Stronger dose)", img: "/assets/images/quiz/potency.png" },
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "currentMedications",
    heading: "Do you currently take any medications?",
    questionsPerRow: 1,
    questions: [
      {
        id: "currentMedications",
        displayQuestion: " ",
        question: "Currently Taking Medications",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "medicationList",
        renderCondition: (answers: any) => answers.currentMedications === "Yes",
        question: "Give more details",
        type: "textarea",
        required: false,
        placeholder: "List all medications, dosages, and frequency",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "howMotivated",
    heading: "Let's better understand how motivated you are.",
    questions: [
      {
        id: "howMotivated",
        question: "How motivated are you to reach {{goalWeight}}lbs?",
        type: "SINGLESELECT",
        options: [
          { label: "I'm ready!", img: "/assets/images/quiz/ready.png" },
          { label: "I'm feeling hopeful", img: "/assets/images/quiz/hopeful.png" },
          { label: "I'm cautious", img: "/assets/images/quiz/cautious.png" },
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "additionalInfo",
    heading: "{{orgName}}' medical providers review every form within 24 hours.",
    questionsPerRow: 1,
    questions: [
      {
        id: "additionalInfoYesNo",
        question: "Do you have any further information which you would like our medical team to know?",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "additionalInfo",
        renderCondition: (answers: any) => answers.additionalInfoYesNo === "Yes",
        question: "Give more details",
        type: "textarea",
        required: false,
        placeholder: "",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "uniqueNeeds",
    heading: "Your needs are unique, and your treatment will be too.",
    questions: [
      {
        id: "uniqueNeeds",
        type: "MULTISELECT",
        displayQuestion: "Please select the following options that you are interested in",
        question: "Unique Needs",
        options: [
          "Maintaining muscle mass as I lose weight",
          "Would prefer not to inject",
          "Managing potential side effects such as nausea/vomiting",
          "Assist with aging and longevity (cellular/DNA damage, immune system dysfunction, etc.)",
          "Improving cognitive function and mental clarity",
          "Improving energy levels",
          "Regulating menses and hormonal status",
          "Improving sleep quality",
          "Not sure - I'd like to discuss formulation options with a clinical via a live virtual consult",
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },


];

export const nadPlusFormSteps: FormStep[] = [
  // Question 1: Physical Activity Level
  {
    id: "physicalActivity",
    heading: "How physically active are you?",
    questions: [
      {
        id: "physicalActivity",
        question: "Physical Activity Level",
        displayQuestion: "Understanding your activity level helps us assess your needs",
        type: "SINGLESELECT",
        displayAsRow: true,
        options: [
          "Sedentary",
          "Somewhat Active",
          "Active but not athletic",
          "Athletic",
          "Competitive/Biohacker"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },

  // Question 2: Reproductive Status
  {
    id: "reproductiveStatus",
    renderCondition: (answers: any) => answers.gender === "Female",
    heading: "Which of the following apply to your reproductive status?",
    questions: [
      {
        id: "reproductiveStatus",
        type: "SINGLESELECT",
        displayAsRow: true,
        displayQuestion: "This information helps us ensure safe treatment",
        question: "Reproductive Status",
        options: [
          "I am not currently pregnant or breastfeeding",
          "I am currently pregnant or breastfeeding",
          "I plan to become pregnant or breastfeed within next 6 months",
          "I am currently going through menopause",
          "I had a hysterectomy or am post-menopause"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },

  // Question 3: Medical Conditions
  {
    id: "medicalConditionsNad",
    heading: "Do you have any one of the following Medical Conditions?",
    questions: [
      {
        id: "medicalConditionsNad",
        type: "MULTISELECT",
        displayQuestion: "Select all that apply",
        question: "Medical Conditions",
        options: [
          "Diabetes",
          "Hypertension (High Blood Pressure)",
          "Thyroid condition",
          "Asthma or COPD",
          "Anxiety or depression",
          "HIV OR AIDS",
          "Kidney disease",
          "Cancer",
          "Arrhythmia or irregular heart beat",
          "Vascular disease (stroke, blood clots etc)",
          "Heart Failure",
          "Gallbladder disease",
          "Liver disease",
          "None of the above"
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },

  // Question 4: BMI Calculation (Height & Weight)
  {
    id: "heightWeight",
    heading: "What is your height and weight? We'll calculate your BMI automatically",
    displayValue: {
      condition: (answers: any) => answers.feet && answers.inches && answers.weight,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "BMI: {{value}}"
    },
    questions: [
      {
        id: "feet",
        question: "Feet",
        type: "DROPDOWN",
        required: true,
        options: [1, 2, 3, 4, 5, 6, 7],
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Inches",
        type: "DROPDOWN",
        required: true,
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (in lbs)",
        type: "number",
        required: true,
        placeholder: "Enter your weight",
        apiType: "TEXT",
      },
    ],
  },

  // Question 5: Gender
  {
    id: "gender",
    heading: "What is your gender?",
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        displayQuestion: "This helps us provide personalized care",
        question: "Gender",
        options: ["Male", "Female"],
        required: true,
        displayAsRow: true,
        apiType: "SINGLESELECT",
      },
    ],
  },

  // Question 6: Liver Function
  {
    id: "liverFunction",
    heading: "Have you ever been told your liver is not working properly?",
    questions: [
      {
        id: "liverFunction",
        question: "Liver Function",
        displayQuestion: "Please provide details if applicable",
        type: "textarea",
        required: true,
        placeholder: "Describe any liver issues or type N/A if none",
        apiType: "TEXT",
      },
    ],
  },

  // Question 5: Heart Function
  {
    id: "heartFunction",
    heading: "Have you ever been told your heart is not pumping properly?",
    questions: [
      {
        id: "heartFunction",
        question: "Heart Function",
        displayQuestion: "Please provide details if applicable",
        type: "textarea",
        required: true,
        placeholder: "Describe any heart issues or type N/A if none",
        apiType: "TEXT",
      },
    ],
  },

  // Question 6: Smoking Status
  {
    id: "smokingStatus",
    heading: "Do you currently smoke?",
    questions: [
      {
        id: "smokingStatus",
        question: "Smoking Status",
        displayQuestion: "Please provide details if applicable",
        type: "text",
        required: true,
        placeholder: "Describe your smoking status or type N/A if none",
        apiType: "TEXT",
      },
    ],
  },

  // Question 7: Family Medical History
  {
    id: "familyHistory",
    heading: "Do any of your immediate family members have a history of the following conditions?",
    questions: [
      {
        id: "familyHistory",
        type: "MULTISELECT",
        question: "Family History",
        displayQuestion: "Check all that apply",
        options: [
          "Cancer",
          "Heart disease",
          "Dementia",
          "Diabetes",
          "High blood pressure",
          "High Cholesterol",
          "None of the above"
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },

  // Question 8: Primary Care Provider
  {
    id: "primaryCareProvider",
    heading: "Do you have a primary care provider?",
    questions: [
      {
        id: "primaryCareProvider",
        question: "Primary Care Provider",
        displayQuestion: "Please provide details if applicable",
        type: "textarea",
        required: true,
        placeholder: "Describe your primary care situation or type N/A if none",
        apiType: "TEXT",
      },
    ],
  },

  // Question 9: Health Check-up
  {
    id: "healthCheckup",
    heading: "Have you had a general health check-up or routine physical in the past three years?",
    questions: [
      {
        id: "healthCheckup",
        question: "Health Check-up",
        displayQuestion: "This helps us understand your current health status",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },


  // Question 11: Allergies
  {
    id: "allergies",
    heading: "Please list all of your known allergies",
    questions: [
      {
        id: "allergies",
        question: "Allergies",
        displayQuestion: "Please type N/A if none. This helps us avoid potential reactions",
        type: "textarea",
        required: true,
        placeholder: "List all known allergies, or type N/A",
        apiType: "TEXT",
      },
    ],
  },

  // Question 12: Interest in NAD
  {
    id: "interestInNad",
    heading: "Understanding your goals helps us provide better care",
    questions: [
      {
        id: "interestInNad",
        question: "Interest in NAD+",
        displayQuestion: "Why are you interested in NAD+ Injections?",
        type: "textarea",
        required: true,
        placeholder: "Please describe your interest in NAD+ therapy",
        apiType: "TEXT",
      },
    ],
  },

  // Question 13: Previous NAD Experience
  {
    id: "previousNadExperience",
    heading: "Have you ever used NAD+ by patch, IV infusion, injection or nasal spray?",
    questions: [
      {
        id: "previousNadExperience",
        question: "Previous NAD+ Experience",
        displayQuestion: "This helps us understand your experience level",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },

  // Question 14: NAD Experience Details (conditional)
  {
    id: "nadExperienceDetails",
    heading: "Please describe and include any reactions, side effects and/or benefits you may have experienced",
    renderCondition: (answers: any) => answers.previousNadExperience === "Yes",
    questions: [
      {
        id: "nadExperienceDetails",
        question: "NAD+ Experience Details",
        displayQuestion: "This helps us understand your previous experience",
        type: "textarea",
        required: true,
        placeholder: "Describe your previous NAD+ experience",
        apiType: "TEXT",
      },
    ],
  },

  // Question 15: Comfort with Self-Injection
  {
    id: "selfInjectionComfort",
    heading: "Do you feel comfortable drawing up the NAD+ solution and injecting yourself using an insulin-sized needle and syringe?",
    questions: [
      {
        id: "selfInjectionComfort",
        question: "Self Injection Comfort",
        displayQuestion: "This helps us determine the best administration method",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },

  // Question 17: Additional Information
  {
    id: "additionalInfo",
    heading: "Is there anything else you want to tell your doctor?",
    questions: [
      {
        id: "additionalInfo",
        question: "Additional Information",
        displayQuestion: "Please share any additional information you think is important (optional)",
        type: "textarea",
        required: false,
        placeholder: "Any additional information for your doctor",
        apiType: "TEXT",
      },
    ],
  },
];

export const sermorelinSteps: FormStep[] = [
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },
  // Question 1: Reproductive Status
  {
    id: "reproductiveStatus",
    renderCondition: (answers: any) => answers.gender === "Female",
    heading: "Are you pregnant, planning to become pregnant, or breastfeeding?",
    questions: [
      {
        id: "reproductiveStatus",
        question: "Reproductive Status",
        displayQuestion: "This information helps us ensure safe treatment",
        type: "SINGLESELECT",
        options: [
          "Currently pregnant",
          "Planning to become pregnant within the next 6 months",
          "Breastfeeding",
          "None of the above"
        ],
        displayAsRow: true,
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },

  // Question 2: Desired Benefits
  {
    id: "desiredBenefits",
    heading: "What benefits are you seeking?",
    questions: [
      {
        id: "desiredBenefits",
        type: "MULTISELECT",
        question: "Desired Benefits",
        displayQuestion: "Please check all that apply. This helps us understand your goals",
        options: [
          "Muscle gain",
          "Fat loss",
          "Improved healing",
          "Memory/cognitive benefits",
          "Better sleep",
          "General anti-aging",
          "Other"
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },

  // Question 3: Medical Contraindications
  {
    id: "medicalContraindications",
    heading: "Do any of the following apply to you?",
    questions: [
      {
        id: "medicalContraindications",
        type: "MULTISELECT",
        question: "Medical Contraindications",
        displayQuestion: "Please select all that apply. This helps us assess safety",
        options: [
          "Active cancer diagnosis",
          "Disease of the pituitary gland",
          "Untreated hypothyroidism",
          "Uncontrolled diabetes",
          "Intracranial lesion/tumor",
          "Heart failure",
          "None of the above"
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },

  // Question 4: BMI Calculation (Height & Weight)
  {
    id: "heightWeight",
    heading: "What is your height and weight? We'll calculate your BMI automatically",
    displayValue: {
      condition: (answers: any) => answers.feet && answers.inches && answers.weight,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "BMI: {{value}}"
    },
    questions: [
      {
        id: "feet",
        question: "Feet",
        type: "DROPDOWN",
        required: true,
        options: [1, 2, 3, 4, 5, 6, 7],
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Inches",
        type: "DROPDOWN",
        required: true,
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (in lbs)",
        type: "number",
        required: true,
        placeholder: "Enter your weight",
        apiType: "TEXT",
      },
    ],
  },


  // Question 5: Gender
  {
    id: "gender",
    heading: "What is your gender?",
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Gender",
        displayQuestion: "This helps us provide personalized care",
        options: ["Male", "Female"],
        required: true,
        apiType: "SINGLESELECT",
        displayAsRow: true,
      },
    ],
  },

  // Question 6: Current Medical Conditions
  {
    id: "currentMedicalConditions",
    heading: "Please list all current medical conditions",
    questions: [
      {
        id: "currentMedicalConditions",
        question: "Current Medical Conditions",
        displayQuestion: "Please type N/A if none. This helps us understand your health profile",
        type: "textarea",
        required: true,
        placeholder: "List current medical conditions, or type N/A ",
        apiType: "TEXT",
      },
    ],
  },

  // Question 5: Current Medications
  {
    id: "currentMedications",
    heading: "Please list all your current medications",
    questions: [
      {
        id: "currentMedications",
        type: "textarea",
        question: "Current Medications",
        displayQuestion: "Please include dosages. Type N/A if none.",
        required: true,
        placeholder: "List medications with dosages, or type N/A",
        apiType: "TEXT",
      },
    ],
  },

  // Question 6: Allergies
  {
    id: "allergies",
    heading: "Please list all of your known allergies",
    questions: [
      {
        id: "allergies",
        question: "Allergies",
        displayQuestion: "Please type N/A if none. This helps us avoid potential reactions",
        type: "textarea",
        required: true,
        placeholder: "List all known allergies, or type N/A if none",
        apiType: "TEXT",
      },
    ],
  },

  // Question 7: Additional Information
  {
    id: "additionalInfo",
    heading: "Is there anything else you want to tell your doctor?",
    questions: [
      {
        id: "additionalInfo",
        question: "Additional Information",
        displayQuestion: "Please share any additional information you think is important (optional)",
        type: "textarea",
        required: false,
        placeholder: "Any additional information for your doctor (optional)",
        apiType: "TEXT",
      },
    ],
  },
];

export const vitaminB12Steps: FormStep[] = [
  // Question 1: B12 Deficiency Diagnosis
  {
    id: "b12DeficiencyDiagnosis",
    heading: "Have you been diagnosed with vitamin B12 deficiency by a physician or other healthcare professional?",
    questions: [
      {
        id: "b12DeficiencyDiagnosis",
        question: "B12 Deficiency Diagnosis",
        displayQuestion: "This helps us understand your current medical status",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },

  // Question 2: Medical Conditions
  {
    id: "medicalConditions",
    heading: "Do you have any of the following conditions?",
    questions: [
      {
        id: "medicalConditions",
        question: "Medical Conditions",
        displayQuestion: "Please check all that apply",
        type: "MULTISELECT",
        options: [
          "Leber's optic neuropathy",
          "Polycythemia Vera",
          "Gout",
          "Low potassium levels",
          "Anemia for any reason other than low vitamin B12",
          "Any other blood disorder",
          "None of the above"
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },

  // Question 3: BMI Calculation (Height & Weight)
  {
    id: "heightWeight",
    heading: "What is your height and weight? We'll calculate your BMI automatically",
    displayValue: {
      condition: (answers: any) => answers.feet && answers.inches && answers.weight,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "BMI: {{value}}"
    },
    questions: [
      {
        id: "feet",
        question: "Feet",
        type: "DROPDOWN",
        required: true,
        options: [1, 2, 3, 4, 5, 6, 7],
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Inches",
        type: "DROPDOWN",
        required: true,
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (in lbs)",
        type: "number",
        required: true,
        placeholder: "Enter your weight",
        apiType: "TEXT",
      },
    ],
  },
  // Question 4: Gender
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },

  // Question 5: Current Medical Conditions
  {
    id: "currentMedicalConditions",
    heading: "Please list all current medical conditions",
    questions: [
      {
        id: "currentMedicalConditions",
        question: "Current Medical Conditions",
        displayQuestion: "Please type N/A if none",
        type: "textarea",
        required: true,
        placeholder: "List current medical conditions, or type N/A",
        apiType: "TEXT",
      },
    ],
  },

  // Question 4: Current Medications
  {
    id: "currentMedications",
    heading: "Please list all your current medications, including prescription, over-the-counter, or supplements.",
    questions: [
      {
        id: "currentMedications",
        question: "Current Medications",
        displayQuestion: "Please include dosages. Type N/A if none.",
        type: "textarea",
        required: true,
        placeholder: "List medications with dosages, or type N/A",
        apiType: "TEXT",
      },
    ],
  },

  // Question 5: Allergies
  {
    id: "allergies",
    heading: "Please list all of your known allergies",
    questions: [
      {
        id: "allergies",
        question: "Allergies",
        displayQuestion: "Please type N/A if none",
        type: "textarea",
        required: true,
        placeholder: "List all known allergies, or type N/A if none",
        apiType: "TEXT",
      },
    ],
  },

  // Question 6: Additional Information
  {
    id: "additionalInfo",
    heading: "Is there anything else you want to tell your doctor?",
    questions: [
      {
        id: "additionalInfo",
        question: "Additional Information",
        displayQuestion: "Please share any additional information you think is important (optional)",
        type: "textarea",
        required: false,
        placeholder: "Any additional information for your doctor",
        apiType: "TEXT",
      },
    ],
  },

  // Question 7: Consultation Type
  {
    id: "consultationType",
    heading: "Choose your preferred consultation method. Email/Text is fastest, Phone/Video has a consultation fee.",
    subtext: "Email/Text is fastest",
    questions: [
      {
        id: "consultationType",
        type: "SINGLESELECT",
        displayAsRow: true,
        question: "$80 consultation fee will apply only if your prescription is approved and you choose not to proceed with treatment. The consultation is free if you move forward with purchasing your prescription. If you prefer to speak with your provider prior to approval, please select Phone or Video Consultation.",

        options: [
          "Email and Text Message (Fastest Option)",
          "Video",
          "Phone Call"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
];

export const sexualHealthSteps: FormStep[] = [
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },
  {
    id: "heightWeight",
    heading: "What is your height and weight? We'll calculate your BMI automatically",
    displayValue: {
      condition: (answers: any) => answers.feet && answers.inches && answers.weight,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "BMI: {{value}}"
    },
    questions: [
      {
        id: "feet",
        question: "Feet",
        type: "DROPDOWN",
        required: true,
        options: [1, 2, 3, 4, 5, 6, 7],
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Inches",
        type: "DROPDOWN",
        required: true,
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (in lbs)",
        type: "number",
        required: true,
        placeholder: "Enter your weight",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "confidenceRating",
    heading: "How do you rate your confidence that you could get and keep an erection?",
    questions: [
      {
        id: "confidenceRating",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "How do you rate your confidence that you could get and keep an erection?",
        displayAsRow: true,
        options: [
          "Very Low",
          "Low",
          "Moderate",
          "High",
          "Very High"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "erectionFrequency",
    heading: "When you have erections with sexual stimulation, how often are your erections hard enough for penetration?",
    questions: [
      {
        id: "erectionFrequency",
        type: "SINGLESELECT",
        displayAsRow: true,
        displayQuestion: " ",
        question: "When you have erections with sexual stimulation, how often are your erections hard enough for penetration?",
        options: [
          "Almost never or never",
          "A few times (less than half the time)",
          "Sometimes (about half the time)",
          "Most times (more than half the time)",
          "Almost always or always"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "erectionDuration",
    heading: "How often were you able to maintain your erection for a long enough period to satisfy yourself and your partner?",
    questions: [
      {
        id: "erectionDuration",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "How often were you able to maintain your erection for a long enough period to satisfy yourself and your partner?",
        displayAsRow: true,
        options: [
          "Almost never or never",
          "A few times (less than half the time)",
          "Sometimes (about half the time)",
          "Most times (more than half the time)",
          "Almost always or always"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "erectionDifficulty",
    heading: "During sexual intercourse, how difficult was it to maintain your erection to completion of intercourse?",
    questions: [
      {
        id: "erectionDifficulty",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "During sexual intercourse, how difficult was it to maintain your erection to completion of intercourse?",
        displayAsRow: true,
        options: [
          "Extremely difficult",
          "Very difficult",
          "Difficult",
          "Slightly difficult",
          "Not difficult"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "intercourseSatisfaction",
    heading: "When you attempted sexual intercourse, how often was it satisfactory to you?",
    questions: [
      {
        id: "intercourseSatisfaction",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "When you attempted sexual intercourse, how often was it satisfactory to you?",
        displayAsRow: true,
        options: [
          "Almost never or never",
          "A few times (less than half the time)",
          "Sometimes (about half the time)",
          "Most times (more than half the time)",
          "Almost always or always"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "edOnset",
    heading: "How did your ED begin?",
    questions: [
      {
        id: "edOnset",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "How did your ED begin?",
        displayAsRow: true,
        options: [
          "Gradually, but has worsened over time",
          "Suddenly, but not with a new partner",
          "Suddenly, with a new partner",
          "I don't know how it began"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "sexLifeSatisfaction",
    heading: "How satisfied have you been with your overall sex life?",
    questions: [
      {
        id: "sexLifeSatisfaction",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "How satisfied have you been with your overall sex life?",
        displayAsRow: true,
        options: [
          "Not at all",
          "A little bit",
          "Somewhat",
          "Quite a bit",
          "Very"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "edMedicationHistory",
    heading: "Have you tried ED medication before?",
    questions: [
      {
        id: "edMedicationHistory",
        displayQuestion: " ",
        question: "Have you tried ED medication before?",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "previousMedications",
    heading: "If yes, please list medication(s) previously tried:",
    renderCondition: (answers) => answers.edMedicationHistory === "Yes",
    questions: [
      {
        id: "previousMedications",
        type: "textarea",
        displayQuestion: " ",
        question: "If yes, please list medication(s) previously tried:",
        required: false,
        placeholder: "List previously tried ED medications",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "bloodPressureHistory",
    heading: "Have you ever been diagnosed with or treated for high or low blood pressure?",
    questions: [
      {
        id: "bloodPressureHistory",
        displayQuestion: " ",
        question: "Have you ever been diagnosed with or treated for high or low blood pressure?",
        type: "SINGLESELECT",
        displayAsRow: true,
        options: [
          "No",
          "Yes, for high blood pressure",
          "Yes, for low blood pressure",
          "I'm not sure"
        ],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "heartConditions",
    heading: "Have you ever been diagnosed with any of these heart conditions?",
    questions: [
      {
        id: "heartConditions",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Have you ever been diagnosed with any of these heart conditions?",
        displayAsRow: true,
        options: [
          "Arrhythmia",
          "Coronary artery disease (narrowing of the heart vessels)",
          "Coronary bypass surgery",
          "Heart attack",
          "Idiopathic Hypertrophic Subaortic Stenosis (aka hypertrophic obstructive cardiomyopathy)",
          "Long QT Syndrome",
          "Any congenital or developmental heart problems",
          "Pulmonary HTN (a rare condition that refers to the blood vessels to the lungs and isn't the same as high blood pressure)",
          "Heart failure",
          "None of these"
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "symptoms",
    heading: "Do you experience any of these symptoms? (Please check off all that apply)",
    questions: [
      {
        id: "symptoms",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Do you experience any of these symptoms? (Please check off all that apply)",
        displayAsRow: true,
        options: [
          "Chest pain when climbing stairs or walking",
          "Chest pain during sexual activity",
          "Sudden loss of vision due to loss of blood flow to your eye (aka anterior ischemic optic neuropathy)",
          "Unexplained fainting or dizziness",
          "Cramping or pain in the calves or legs with exercise (aka claudication)",
          "None of these"
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "medicalConditions",
    heading: "Have you ever been diagnosed with or experienced the following?",
    questions: [
      {
        id: "medicalConditions",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Have you ever been diagnosed with or experienced the following?",
        displayAsRow: true,
        options: [
          "Organ transplant",
          "Kidney failure, disease, or dialysis",
          "Liver disease",
          "Retinitis Pigmentosa, a genetic condition that typically causes gradual changes to your vision",
          "Nonarteritic anterior ischemic optic neuropathy (NAION)",
          "Diabetes",
          "Told not to have sex for any reason",
          "Sickle Cell Anemia",
          "Stroke",
          "Peyronie's disease or pain with erections",
          "Foreskin that's too tight",
          "Active stomach, intestinal, or bowel ulcers or bleeding",
          "Bleeding disorder (causing you to bleed more easily than is normal)",
          "Multiple sclerosis, paralysis, or spinal cord injury",
          "Clotting disorder (you form clots more easily than is normal)",
          "None of the above"
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "recreationalDrugs",
    heading: "Have you used any of these recreational drugs in the last 6 months?",
    questions: [
      {
        id: "recreationalDrugs",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Have you used any of these recreational drugs in the last 6 months?",
        displayAsRow: true,
        options: [
          "Crystal meth (methamphetamines or amphetamines)",
          "Poppers or Rush",
          "Amyl Nitrate or Butyl Nitrate",
          "Cocaine",
          "Molly (MDMA, ecstasy)",
          "No, I haven't used these recreational drugs in the last 6 months"
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "currentMedicalConditions",
    heading: "Please list all current medical conditions. Please type N/A if none.",
    questions: [
      {
        id: "currentMedicalConditions",
        type: "textarea",
        displayQuestion: " ",
        question: "Please list all current medical conditions. Please type N/A if none.",
        required: true,
        placeholder: "List current medical conditions, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "contraindicatedMedications",
    heading: "Do you currently use or have prescriptions for any of these medications?",
    questions: [
      {
        id: "contraindicatedMedications",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Do you currently use or have prescriptions for any of these medications?",
        displayAsRow: true,
        options: [
          "Any medication containing nitrates",
          "Any ALPHA blocker, NOT beta blocker (like Flomax, Cardura, and Minipress)",
          "Nitroglycerin in any form (spray, tablet, patch, or ointment)",
          "Supplements that boost nitric oxide (like L-arginine, L-citrulline, beet root powder/extract/juice concentrate)",
          "Monoket (isosorbide mononitrate), Bidil, or Isordil (isorbide dinitrate), which are commonly prescribed to prevent chest pain caused by heart disease)",
          "Antiretrovirals or any treatment for HIV",
          "Adempas (riociguat)",
          "None of the above"
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "currentMedications",
    heading: "Please list all prescription or over-the-counter medications and supplements you are currently taking. Please type N/A if none",
    questions: [
      {
        id: "currentMedications",
        type: "textarea",
        required: true,
        displayQuestion: " ",
        question: "Please list all prescription or over-the-counter medications and supplements you are currently taking. Please type N/A if none",
        placeholder: "List medications with dosages, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "allergies",
    heading: "Please list allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Please type N/A if none",
    questions: [
      {
        id: "allergies",
        type: "textarea",
        displayQuestion: " ",
        question: "Please list allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Please type N/A if none",
        required: true,
        placeholder: "List all known allergies, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "additionalInfo",
    heading: "Is there anything else you'd like your provider to know?",
    questions: [
      {
        id: "additionalInfo",
        type: "YESNO",
        displayQuestion: " ",
        question: "Is there anything else you want to tell your doctor?",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "providerMessage",
        renderCondition: (answers) => answers.additionalInfo === "Yes",
        type: "textarea",
        displayQuestion: " ",
        question: "Is there anything else you want to tell your doctor?",
        required: false,
        placeholder: "Your message to your doctor",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "edEducation",
    heading: "ED can be a sign of other undiagnosed medical issues, like heart problems.",
    subtext: "In addition to seeking ED treatment, we recommend you speak with your primary care provider to rule out other underlying conditions.",
    headingsInline: true,
    questions: [
      {
        id: "edEducation",
        type: "MARKETING",
      },
    ],
  },
  // {
  //   id: "treatmentPreferences",
  //   heading: "Let's talk about treatment preferences.",
  //   heading2: "",
  //   subtext: "",
  //   questions: [
  //     {
  //       id: "treatmentPreferences",
  //       type: "MARKETING",
  //       required: false,
  //     },
  //   ],
  // },
  // {
  //   id: "treatmentOption",
  //   title: "Which treatment option best fits your needs?",
  //   subtext: "",
  //   questions: [
  //     {
  //       id: "treatmentOption",
  //       type: "SINGLESELECT",
  //       question: "If you have any preferences, we want to take those into account. Your provider will still review everything and make sure you're getting the best treatment for you.",
  //       displayAsRow: true,
  //       options: [
  //         "Sildenafil",
  //         "Tadalafil"
  //       ],
  //       required: true,
  //       apiType: "SINGLESELECT",
  //     },
  //   ],
  // },
];

export const womensHRTFormSteps: FormStep[] = [
  {
    id: "heightWeight",
    title: "What is your height and weight?",
    heading: "Hi <span class='text-accentColor1'>{{firstName}},</span> tell us a bit about your current health.",
    headingsInline: true,
    displayValue: {
      condition: (answers: any) => answers.feet != null && answers.inches != null && answers.weight,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "Your BMI score is {{value}}",
    },
    subtext:
      "Protected under HIPAA and GDPR standards. Your information is private and used only for your medical review.",
    questions: [
      {
        id: "feet",
        question: "Height (feet)",
        type: "number",
        required: true,
        maxValue: 8,
        maxLength: 1,
        minValue: 3,
        numbersOnly: true,
        placeholder: "E.g. 5",
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Height (inches)",
        type: "number",
        required: true,
        maxValue: 11,
        maxLength: 2,
        minValue: 0,
        numbersOnly: true,
        placeholder: "E.g. 2",
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (pounds)",
        type: "number",
        required: true,
        placeholder: "E.g 310",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },
  {
    id: "womensHRTMenstrualStatus",
    heading: "Which of the following applies to you?",
    renderCondition: (answers: any) => answers.gender === "Female",
    questions: [
      {
        id: "womensHRTMenstrualStatus",
        type: "SINGLESELECT",
        question: "Which of the following applies to you?",
        displayQuestion: " ",
        options: [
          "I am still having regular periods",
          "I am still having periods but they have become irregular",
          "I stopped having periods less than 12 months ago",
          "I stopped having periods 12 or more months ago",
          "I am in surgical menopause due to removal of my ovaries",
          "I had a hysterectomy but I am having symptoms of menopause",
        ],
        required: true,
        displayAsRow: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "womensHRTSymptoms",
    heading: "Which of the following symptoms are you experiencing? (check all that apply)",
    questions: [
      {
        id: "womensHRTSymptoms",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Which of the following symptoms are you experiencing? (check all that apply)",
        options: [
          "None of these",
          "Acne or hair changes",
          "Anxiety or depression",
          "Vaginal dryness, itching, or pain in general or during sex",
          "Urinary incontinence or frequent urinary tract infections",
          "Irregular bleeding or spotting",
          "Trouble sleeping",
          "Irritability, Anxiety, depression, or mood swings",
          "Brain fog / Memory issues",
          "Fatigue / Low energy",
          "Hot flashes / Night sweats",
          "Weight gain",
          "Loss of muscle mass or strength",
          "Decreased libido",
          "Breast tenderness",
          "Joint or muscle pain",
          "Migraines or headaches",
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "womensHRTPreviousHRT",
    heading: "Have you ever taken any of the below products?",
    questionsPerRow: 1,
    questions: [
      {
        id: "womensHRTPreviousHRT",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Have you ever taken any of the below products?",
        options: [
          "None of these",
          "Estrogen patches .5-.10",
          "Estrogen cream compounded",
          "Vaginal Estrogen cream",
          "Injectable estrogen",
          "Injectable testosterone",
          "Androgel",
          "Testosterone compounded cream",
          "Progesterone oral, vaginal and cream",
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
      {
        id: "womensHRTPreviousHRTDetails",
        question: "Please tell us more about the dose and delivery method (injection, cream, etc.) of medication you took as well as any side effects you experienced.",
        type: "textarea",
        required: false,
        placeholder: "Please provide details...",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "pregnancy",
    title: "Do any of these apply to you?",
    heading: "Safety, first.",
    renderCondition: (answers) => answers.gender === "Female",
    questions: [
      {
        id: "pregnancy",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Do any of these apply to you about pregnancy?",
        options: [
          "None of these",
          "Currently or possibly pregnant",
          "Actively trying to become pregnant",
          "Breastfeeding",
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "womensHRTMedicalConditions",
    heading: "Please check all current or past medical conditions. (Select all that apply)",
    questions: [
      {
        id: "womensHRTMedicalConditions",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Please check all current or past medical conditions. (Select all that apply)",
        options: [
          "None of these",
          "Asthma",
          "Autoimmune disease like systemic lupus erythematosus (SLE)",
          "Blood vessel disease or blood clotting disorder",
          "Breast, uterine, or ovarian cancer",
          "Heart disease, stroke, or peripheral vascular disease",
          "Dementia",
          "Edema (fluid retention or body swelling)",
          "Endometriosis",
          "Epilepsy (seizures)",
          "High blood lipids or cholesterol",
          "Hypertension (high blood pressure)",
          "High cholesterol",
          "Diabetes",
          "Heart failure or stroke",
          "Liver disease",
          "Kidney disease",
          "Migraine headache",
          "Hypercalcemia (high calcium in the blood)",
          "Uncontrolled thyroid disorder",
          "Recent miscarriage",
          "Vaginal bleeding",
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "womensHRTCurrentConditions",
    heading: "Do you have any current medical conditions?",
    questions: [
      {
        id: "womensHRTHasCurrentConditions",
        type: "YESNO",
        displayQuestion: " ",
        question: "Do you have any current medical conditions?",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "womensHRTCurrentConditions",
        question: "Please list all current medical conditions",
        type: "textarea",
        required: true,
        placeholder: "Please provide details...",
        renderCondition: (answers: any) => answers.womensHRTHasCurrentConditions === "Yes",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "womensHRTMedications",
    heading: "Are you currently taking any medications or supplements?",
    questions: [
      {
        id: "womensHRTHasMedications",
        type: "YESNO",
        displayQuestion: " ",
        question: "Are you currently taking any medications or supplements?",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "womensHRTMedications",
        question: "Please list all your current medications, including prescription, over-the-counter, and supplements, including dosages",
        type: "textarea",
        required: true,
        placeholder: "Please provide details...",
        renderCondition: (answers: any) => answers.womensHRTHasMedications === "Yes",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "womensHRTAllergies",
    heading: "Do you have any allergies?",
    questions: [
      {
        id: "womensHRTHasAllergies",
        type: "YESNO",
        displayQuestion: " ",
        question: "Do you have any allergies?",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "womensHRTAllergies",
        question: "Please list all of your known allergies",
        type: "textarea",
        required: true,
        placeholder: "Please provide details...",
        renderCondition: (answers: any) => answers.womensHRTHasAllergies === "Yes",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "womensHRTLifestyle",
    heading: "Do you currently smoke or use tobacco products?",
    questions: [
      {
        id: "womensHRTSmoking",
        type: "YESNO",
        displayQuestion: " ",
        question: "Do you currently smoke or use tobacco products?",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "womensHRTConsents",
    heading: "Please review and accept the following",
    questions: [
      {
        id: "womensHRTPCPConsent",
        type: "CHECKBOX",
        options: ["I accept"],
        required: true,
        question: "Our providers mainly keep an eye on and help with BHRT, but it's important to remember that your overall health in involves more than just this. It's recommended to regularly check in with your regular doctor (PCP), and let them know that you are taking these products. They can check various other important aspects of your health. We strongly suggest getting a checkup and blood test done by your doctor every year to make sure your health is in good shape. I understand I should let primary care provider know that I have started hormonal replacement therapy and to follow up with my primary care provider for ongoing monitoring and check ups.",
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "womensHRTFileUploads",
    heading: "Please upload required documents",
    renderCondition: (answers) => {
      const previousHRT = answers.womensHRTPreviousHRT;
      // Show step only if there are selected items and "None of the above" is not selected
      return Array.isArray(previousHRT) &&
        previousHRT.length > 0 &&
        !previousHRT.includes("None of these");
    },
    questions: [
      {
        id: "womensHRTPrescriptions",
        question: "Please upload any prescriptions (within 60 days), including medications (testosterone, estradiol, progesterone, etc.) for review.",
        type: "FILE_INPUT",
        required: false,
        apiType: "FILE",
      },
    ],
  },
  {
    id: "womensHRTConsultationType",
    heading: "Which type of consultation would you prefer?",
    questions: [
      {
        id: "womensHRTConsultationType",
        displayAsRow: true,
        type: "SINGLESELECT",
        question: "Which type of consultation would you prefer?",
        displayQuestion: " ",
        options: ["Sync- Phone", "Sync- Video"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
];

export const mensHRTFormSteps: FormStep[] = [
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },
  {
    id: "heightWeight",
    title: "What is your height and weight?",
    heading: "Hi <span class='text-accentColor1'>{{firstName}},</span> tell us a bit about your current health.",
    headingsInline: true,
    displayValue: {
      condition: (answers: any) => answers.feet != null && answers.inches != null && answers.weight,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "Your BMI score is {{value}}",
    },
    subtext:
      "Protected under HIPAA and GDPR standards. Your information is private and used only for your medical review.",
    questions: [
      {
        id: "feet",
        question: "Height (feet)",
        type: "number",
        required: true,
        maxValue: 8,
        maxLength: 1,
        minValue: 3,
        numbersOnly: true,
        placeholder: "E.g. 5",
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Height (inches)",
        type: "number",
        required: true,
        maxValue: 11,
        maxLength: 2,
        minValue: 0,
        numbersOnly: true,
        placeholder: "E.g. 2",
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (pounds)",
        type: "number",
        required: true,
        placeholder: "E.g 310",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "hrtSymptoms",
    heading: "Please select symptoms you are experiencing from the following list. Select all that apply.",
    questions: [
      {
        id: "hrtSymptoms",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Please select symptoms you are experiencing from the following list. Select all that apply.",
        options: [
          "Feeling tired or fatigued or low energy",
          "Reduced sexual desire",
          "Erectile dysfunction",
          "Decreased facial/body hair growth",
          "Decreased motivation or confidence",
          "Depression or anxiety",
          "Unexplained reduction in strength or muscle size",
          "Unexplained increase in body fat unrelated to diet or exercise",
          "Low libido / sexual performance",
          "Hot flashes / night sweats",
          "Depressed mood or irritability",
          "Sleep disturbances",
          "Poor concentration or memory",
          "Trouble concentrating or brain fog",
          "Other",
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "hrtTestosteroneHistory",
    heading: "Have you ever taken Testosterone or any other prescription medication for low-testosterone?",
    questions: [
      {
        id: "hrtTestosteroneHistory",
        type: "YESNO",
        displayQuestion: " ",
        question: "Have you ever taken Testosterone or any other prescription medication for low-testosterone?",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "hrtTestosteroneDetails",
        question: "Please tell us more about the dose and delivery method (injection, cream, etc.) of testosterone you took as well as any side effects you experienced.",
        type: "textarea",
        required: false,
        placeholder: "Please provide details...",
        renderCondition: (answers: any) => answers.hrtTestosteroneHistory === "Yes",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "hrtFertility",
    heading: "Are you currently trying to have children or planning to preserve fertility?",
    questions: [
      {
        id: "hrtFertility",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "Are you currently trying to have children or planning to preserve fertility?",
        options: ["Yes", "No", "Unsure"],
        displayAsRow: true,
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "hrtHealthConditions",
    heading: "Do you have, or have you had any of the following (select all that apply):",
    questions: [
      {
        id: "hrtHealthConditions",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Do you have, or have you had any of the following (select all that apply):",
        options: [
          "None of these",
          "Prostate cancer or an undiagnosed prostate problem (lump or mass, inflammation)",
          "Cardiovascular disease (heart disease or prior heart attack)",
          "Diabetes",
          "A blood clot in the leg or lung",
          "Urinary symptoms (slow stream, difficulty emptying bladder, etc.)",
          "Thrombophilia (an increased tendency to form blood clots)",
          "Untreated or severe obstructive sleep apnea",
          "Gynecomastia (breast tissue)",
          "Polycythemia (hematocrit >54%)",
          "Elevated PSA levels",
          "History of aggression, mood disorders, or psychosis",
          "Infertility or low sperm count",
          "Kidney disease",
          "Liver disease",
          "Prostate conditions (BPH, elevated PSA, cancer)",
          "Sleep apnea",
        ],
        required: true,
        displayAsRow: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "hrtCurrentConditions",
    heading: "Do you have any current medical conditions?",
    questions: [
      {
        id: "hrtHasCurrentConditions",
        displayQuestion: " ",
        question: "Do you have any current medical conditions?",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "hrtCurrentConditions",
        question: "Please list all current medical conditions",
        type: "textarea",
        required: true,
        placeholder: "Please provide details...",
        renderCondition: (answers: any) => answers.hrtHasCurrentConditions === "Yes",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "hrtMedications",
    heading: "Are you currently taking any medications or supplements?",
    questions: [
      {
        id: "hrtHasMedications",
        displayQuestion: " ",
        question: "Are you currently taking any medications or supplements?",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "hrtMedications",
        question: "Please list any prescription or over the counter medications or supplements you are taking",
        type: "textarea",
        required: true,
        placeholder: "Please provide details...",
        renderCondition: (answers: any) => answers.hrtHasMedications === "Yes",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "hrtAllergies",
    heading: "Do you have any allergies?",
    subtext: "Including allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else",
    questions: [
      {
        id: "hrtHasAllergies",
        displayQuestion: " ",
        question: "Do you have any allergies?",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "hrtAllergies",
        question: "Please list all of your known allergies",
        type: "textarea",
        required: true,
        placeholder: "Please provide details...",
        renderCondition: (answers: any) => answers.hrtHasAllergies === "Yes",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "hrtSurgeries",
    heading: "Have you had any surgeries?",
    questions: [
      {
        id: "hrtHasSurgeries",
        displayQuestion: " ",
        question: "Have you had any surgeries?",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "hrtSurgeries",
        question: "Please list all the surgeries you had",
        type: "textarea",
        required: true,
        placeholder: "Please provide details...",
        renderCondition: (answers: any) => answers.hrtHasSurgeries === "Yes",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "hrtLabWork",
    heading: "Do you have any recent lab work related to hormone therapy completed within the past 45 days?",
    questionsPerRow: 1,
    questions: [
      {
        id: "hrtHasLabWork",
        displayQuestion: " ",
        question: "Do you have any recent lab work related to hormone therapy completed within the past 45 days?",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
      {
        id: "hrtLabWork",
        question: "Please upload a copy of your recent lab work related to hormone therapy. (Be sure that your full name and date on the lab results)",
        type: "FILE_INPUT",
        required: true,
        renderCondition: (answers: any) => answers.hrtHasLabWork === "Yes",
        apiType: "FILE",
      },
    ],
  },
  {
    id: "hrtLifestyle",
    heading: "Do you smoke or consume alcohol?",
    questions: [
      {
        id: "hrtSmokingAlcohol",
        displayQuestion: " ",
        question: "Do you smoke or consume alcohol?",
        type: "YESNO",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "hrtConsultationType",
    heading: "Which type of consultation would you prefer?",
    questions: [
      {
        id: "hrtConsultationType",
        displayQuestion: " ",
        question: "Which type of consultation would you prefer?",
        displayAsRow: true,
        type: "SINGLESELECT",
        options: ["Sync- Video", "Sync - Phone Call"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "hrtConsents",
    heading: "Please review and accept the following",
    questionsPerRow: 1,
    questions: [
      {
        id: "hrtPCPConsent",
        type: "CHECKBOX",
        options: ["I agree to do this"],
        required: true,
        question: "Our providers mainly keep an eye on and help with testosterone replacement, but it's important to remember that your overall health in involves more than just this. It's recommended to regularly check in with your regular doctor (PCP), and let them know that you are taking testosterone. They can check various other important aspects of your health. We strongly suggest getting a checkup and blood test done by your doctor every year to make sure your health is in good shape. I understand I should let primary care provider know that I have started testosterone replacement therapy and to follow up with my primary care provider for ongoing monitoring and check ups.",
        apiType: "SINGLESELECT",
      },
      {
        id: "hrtTelemedicineConsent",
        type: "CHECKBOX",
        options: ["I agree and consent to receiving care via telemedicine."],
        required: true,
        question: "I verify that I am the patient and that I have answered the questions asked in this intake form. I confirm that I have reviewed and understood all the questions asked of me. I attest that the answers and information I have provided are true and complete to the best of my knowledge. I understand that it is critical to my health to share complete health information with my doctor.",
        apiType: "SINGLESELECT",
      },
    ],
  },
];

export const glutathioneSteps: FormStep[] = [
  {
    id: "heightWeight",
    title: "What is your height and weight?",
    heading: "BMI Calculation",
    displayValue: {
      condition: (answers: any) => answers.feet && answers.inches && answers.weight,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "BMI: {{value}}"
    },
    questions: [
      {
        id: "feet",
        question: "Feet",
        type: "DROPDOWN",
        required: true,
        options: [1, 2, 3, 4, 5, 6, 7],
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Inches",
        type: "DROPDOWN",
        required: true,
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (in lbs)",
        type: "number",
        required: true,
        placeholder: "Enter your weight",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },
  {
    id: "reproductiveStatus",
    renderCondition: (answers: any) => answers.gender === "Female",
    title: "Which of the following apply to your reproductive status?",
    questions: [
      {
        id: "reproductiveStatus",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "Which of the following apply to your reproductive status?",
        displayAsRow: true,
        options: [
          "I am not currently pregnant nor breastfeeding",
          "I am currently pregnant or breastfeeding",
          "I plan to become pregnant or breastfeed within the next 6 months",
          "I am currently going through menopause",
          "I had a hysterectomy or am post-menopausal"
        ],
        required: false,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "medicalConditions",
    title: "Do you have any one of the following Medical Conditions? (Check all that apply)",
    questions: [
      {
        id: "medicalConditions",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Do you have any one of the following Medical Conditions? (Check all that apply)",
        displayAsRow: true,
        options: [
          "Chronic kidney disease",
          "Asthma",
          "Zinc deficiency",
          "None of the above"
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "glutathioneInterest",
    title: "Why are you interested in glutathione supplementation?",
    questions: [
      {
        id: "glutathioneInterest",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Why are you interested in glutathione supplementation?",
        displayAsRow: true,
        options: [
          "To help with a chronic disease",
          "For energy support",
          "For aging support",
          "Other"
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "currentMedicalConditions",
    title: "Please list all current medical conditions. Please type N/A if none.",
    questions: [
      {
        id: "currentMedicalConditions",
        type: "textarea",
        displayQuestion: " ",
        question: "Please list all current medical conditions. Please type N/A if none.",
        required: true,
        placeholder: "List current medical conditions, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "currentMedications",
    title: "Please list all your current medications, including prescription, over-the-counter, and supplements, including dosages. Please type N/A if none.",
    questions: [
      {
        id: "currentMedications",
        type: "textarea",
        displayQuestion: " ",
        question: "Please list all your current medications, including prescription, over-the-counter, and supplements, including dosages. Please type N/A if none.",
        required: true,
        placeholder: "List medications with dosages, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "allergies",
    title: "Please list allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Please type N/A if none.",
    questions: [
      {
        id: "allergies",
        type: "textarea",
        displayQuestion: " ",
        question: "Please list allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Please type N/A if none.",
        required: true,
        placeholder: "List all known allergies, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "additionalInfo",
    title: "Is there anything else you want to tell your doctor?",
    questions: [
      {
        id: "additionalInfo",
        type: "textarea",
        displayQuestion: " ",
        question: "Is there anything else you want to tell your doctor?",
        required: true,
        placeholder: "Any additional information for your doctor",
        apiType: "TEXT",
      },
    ],
  },
];

export const methyleneBlueFormSteps: FormStep[] = [
  {
    id: "heightWeight",
    heading: "What is your height and weight? We'll calculate your BMI automatically",
    displayValue: {
      condition: (answers: any) => answers.feet && answers.inches && answers.weight,
      calculate: (answers: any) => {
        const heightInInches = (answers.feet * 12) + answers.inches;
        const heightInMeters = heightInInches * 0.0254;
        const weightInKg = answers.weight * 0.453592;
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        return bmi.toFixed(2);
      },
      template: "BMI: {{value}}"
    },
    questions: [
      {
        id: "feet",
        question: "Feet",
        type: "DROPDOWN",
        required: true,
        options: [1, 2, 3, 4, 5, 6, 7],
        apiType: "TEXT",
      },
      {
        id: "inches",
        question: "Inches",
        type: "DROPDOWN",
        required: true,
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        apiType: "TEXT",
      },
      {
        id: "weight",
        question: "Weight (in lbs)",
        type: "number",
        required: true,
        placeholder: "Enter your weight",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "gender",
    heading: "To personalize your treatment, we first need to understand your unique needs.",
    questionsPerRow: 1,
    questions: [
      {
        id: "gender",
        type: "SINGLESELECT",
        question: "Are you male of female?",
        options: [
          { label: "Female", img: "/assets/images/option_icons/gender_option2.svg" },
          { label: "Male", img: "/assets/images/option_icons/gender_option1.svg" },
        ],
        required: true,
        apiType: "SINGLESELECT",
        optionRowLayout: [2, 2] // [mobile, desktop] - 1 per row on mobile (stacked), 2 per row on desktop (side-by-side)
      },
    ],
  },
  {
    id: "reproductiveStatus",
    renderCondition: (answers: any) => answers.gender === "Female",
    heading: "Which of the following apply to your reproductive status?",
    questions: [
      {
        id: "reproductiveStatus",
        type: "SINGLESELECT",
        displayQuestion: " ",
        question: "Which of the following apply to your reproductive status?",
        displayAsRow: true,
        options: [
          "I am not currently pregnant nor breastfeeding",
          "I am currently pregnant or breastfeeding",
          "I plan to become pregnant or breastfeed within the next 6 months",
          "I am currently going through menopause",
          "I had a hysterectomy or am post-menopausal",
          "I am male",
        ],
        required: false,
        apiType: "SINGLESELECT",
      },
    ],
  },
  {
    id: "medicalConditions",
    heading: "Do you have any one of the following Medical Conditions? (Check all that apply)",
    questions: [
      {
        id: "medicalConditions",
        type: "MULTISELECT",
        displayQuestion: " ",
        question: "Do you have any one of the following Medical Conditions? (Check all that apply)",
        displayAsRow: true,
        options: [
          "Glucose-6-phosphate dehydrogenase (G6PD) deficiency",
          "Hemolytic anemia",
          "Liver disease",
          "Kidney disease",
          "None of these",
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "methyleneBlueInterest",
    heading: "Why are you interested in taking methylene blue?",
    questions: [
      {
        id: "methyleneBlueInterest",
        type: "MULTISELECT",
        displayAsRow: true,
        displayQuestion: " ",
        question: "Why are you interested in taking methylene blue?",
        options: [
          "Increased energy",
          "Enhanced cognition",
          "Aging support",
          "Prevention of neurodegenerative diseases",
          "Other",
        ],
        required: true,
        apiType: "MULTISELECT",
      },
    ],
  },
  {
    id: "currentMedicalConditions",
    heading: "Please list all current medical conditions. Please type N/A if none.",
    questions: [
      {
        id: "currentMedicalConditions",
        type: "textarea",
        displayQuestion: " ",
        question: "Please list all current medical conditions. Please type N/A if none.",
        required: true,
        placeholder: "List current medical conditions, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "currentMedications",
    heading: "Please list all your current medications, including prescription, over-the-counter, and supplements, including dosages. Please type N/A if none.",
    subtext: "Methylene blue should not be combined with certain medications due to a rare but life-threatening condition called serotonin syndrome. It is important that you list all medications you are currently taking and update all your healthcare providers when you begin taking a new medication.",
    questions: [
      {
        id: "currentMedications",
        type: "textarea",
        displayQuestion: " ",
        question: "Please list all your current medications, including prescription, over-the-counter, and supplements, including dosages. Please type N/A if none.",
        required: true,
        placeholder: "List medications with dosages, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "allergies",
    heading: "Please list allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Please type N/A if none.",
    questions: [
      {
        id: "allergies",
        type: "textarea",
        displayQuestion: " ",
        question: "Please list allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Please type N/A if none.",
        required: true,
        placeholder: "List all known allergies, or type N/A",
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "methyleneBlueAllergy",
    heading: "Are you allergic to methylene blue or thiazine dye?",
    questions: [
      {
        id: "methyleneBlueAllergy",
        type: "YESNO",
        displayQuestion: " ",
        question: "Are you allergic to methylene blue or thiazine dye?",
        options: ["Yes", "No"],
        required: true,
        apiType: "SINGLESELECT",
      },
    ],
  },
];

export const contactFormSteps: FormStep[] = [
  {
    id: "dob",
    heading: "What is your date of birth?",
    questionsPerRow: 3,
    questions: [
      {
        id: "dobMonth",
        type: "text",
        inputmode: "numeric",
        question: "Month",
        placeholder: "MM",
        required: true,
        minValue: 1,
        maxValue: 12,
        maxLength: 2,
        numbersOnly: true,
        apiType: "TEXT",
      },
      {
        id: "dobDay",
        type: "text",
        inputmode: "numeric",
        question: "Day",
        placeholder: "DD",
        required: true,
        minValue: 1,
        maxValue: 31,
        maxLength: 2,
        numbersOnly: true,
        apiType: "TEXT",
      },
      {
        id: "dobYear",
        type: "number",
        inputmode: "numeric",
        question: "Year",
        placeholder: "YYYY",
        required: true,
        minValue: 1921,
        maxLength: 4,
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "personalInfo",
    heading: "Your Medical Review",
    subtext: "Let's proceed to check your eligibility.",
    questionsPerRow: 1,
    questions: [
      {
        id: "firstName",
        question: "First Name",
        type: "text",
        required: true,
        placeholder: "Enter your first name",
        apiType: "TEXT",
      },
      {
        id: "lastName",
        question: "Last Name",
        type: "text",
        required: true,
        placeholder: "Enter your last name",
        apiType: "TEXT",
      },
      {
        id: "shippingState",
        question: "What state will your medication be shipped to?",
        type: "DROPDOWN",
        required: true,
        options: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
        apiType: "TEXT",
      },
    ],
  },
  {
    id: "contactInfo",
    heading: "{{firstName}}, how can you be reached if necessary?",
    showTrustBadges: true,
    subtext: "Our medical teams and pharmacy use email/text for patient communication.",
    questionsPerRow: 1,
    questions: [
      {
        id: "email",
        question: "Email Address",
        type: "email",
        required: true,
        placeholder: "you@example.com",
        apiType: "TEXT",
        validation: [
          { type: "required", message: "Email address is required" },
          { type: "email", message: "Please enter a valid email address" },
        ],
      },
      {
        id: "phone",
        question: "Phone Number",
        type: "tel",
        required: true,
        placeholder: "123-456-7890",
        apiType: "TEXT",
        validation: [
          { type: "required", message: "Phone number is required" },
          {
            type: "phone",
            message:
              "Please enter a valid US phone number (e.g., 123-456-7890 or (123) 456-7890)",
          },
        ],
      },
      {
        id: "smsConsent",
        type: "CHECKBOX",
        required: false,
        options: [`I consent to receive marketing text messages from ${orgName} at the phone number provided, including promotions, discounts, and product/service updates. Msg frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to opt out. Consent is not a condition of purchase. See Terms and Privacy Policy.`],
        apiType: "SINGLESELECT",
      },
    ],
  },
];
