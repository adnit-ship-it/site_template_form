import type { QuizConfig, FormStep } from "~/types/form";

// Cache for loaded quiz configs to avoid re-importing
const quizCache = new Map<string, QuizConfig>();

// Lazy loaders — each quiz only imports its step data when first requested
const quizLoaders: Record<string, () => Promise<QuizConfig>> = {
  "weight-loss": async () => {
    const { glp1Steps, contactFormSteps } = await import("./formSteps");
    return {
      id: "weight-loss",
      name: "Weight Loss Intake Form",
      description:
        "Comprehensive medical intake form for GLP-1 weight loss medication",
      version: "1.0.0",
      progressSteps: [
        { id: "start", name: "Start", description: "Weight loss goals and past initiatives" },
        { id: "preliminary", name: "Preliminary", description: "BMI, age, and GLP-1 medication status" },
        { id: "health", name: "Health", description: "Health screening and medical history" },
        { id: "details", name: "Details", description: "Current medications and surgical history" },
        { id: "eligibility", name: "Eligibility", description: "ID upload, consultation type, and consent" },
      ],
      stepProgressMapping: [
        { stepId: "heightWeight", progressStepId: "start" },
        { stepId: "goalWeight", progressStepId: "start" },
        { stepId: "gender", progressStepId: "start" },
        { stepId: "pregnancyStatus", progressStepId: "start" },
        { stepId: "priority", progressStepId: "preliminary" },
        { stepId: "marketing1", progressStepId: "preliminary" },
        { stepId: "quote1", progressStepId: "preliminary" },
        { stepId: "marketing2", progressStepId: "preliminary" },
        { stepId: "motivation", progressStepId: "preliminary" },
        { stepId: "pace", progressStepId: "health" },
        { stepId: "perfect", progressStepId: "health" },
        { stepId: "sleepHabits", progressStepId: "health" },
        { stepId: "sleepHabitsTime", progressStepId: "health" },
        { stepId: "quote2", progressStepId: "health" },
        { stepId: "medicalConditions1", progressStepId: "health" },
        { stepId: "medicalConditions2", progressStepId: "health" },
        { stepId: "currentGlp1", progressStepId: "health" },
        { stepId: "currentGlp1Type", progressStepId: "health" },
        { stepId: "lastDoseDate", progressStepId: "health" },
        { stepId: "lastDoseStrength", progressStepId: "health" },
        { stepId: "dosagePreference", progressStepId: "health" },
        { stepId: "opiates", progressStepId: "health" },
        { stepId: "weightLossSurgery", progressStepId: "health" },
        { stepId: "weightLossPrograms", progressStepId: "details" },
        { stepId: "clinicallyAppropriate", progressStepId: "details" },
        { stepId: "weightChangeLastYear", progressStepId: "details" },
        { stepId: "quote3", progressStepId: "details" },
        { stepId: "avgBloodPressure", progressStepId: "details" },
        { stepId: "avgHeartRate", progressStepId: "details" },
        { stepId: "findTreatment", progressStepId: "details" },
        { stepId: "currentMedications", progressStepId: "details" },
        { stepId: "howMotivated", progressStepId: "details" },
        { stepId: "additionalInfo", progressStepId: "details" },
        { stepId: "uniqueNeeds", progressStepId: "details" },
        { stepId: "dob", progressStepId: "eligibility" },
        { stepId: "personalInfo", progressStepId: "eligibility" },
      ],
      steps: [...glp1Steps, ...contactFormSteps],
    };
  },

  "nad-plus": async () => {
    const { nadPlusFormSteps, contactFormSteps } = await import("./formSteps");
    return {
      id: "nad-plus",
      name: "NAD+ Injections Intake Form",
      description:
        "Medical intake form for NAD+ injection therapy. Please provide complete and truthful information to help your physician determine the best treatment for you.",
      version: "1.0.0",
      progressSteps: [
        { id: "basics", name: "Basics", description: "Activity level, reproductive status, and body metrics" },
        { id: "health", name: "Health", description: "Medical conditions and organ health" },
        { id: "lifestyle", name: "Lifestyle", description: "Smoking, family history, and primary care" },
        { id: "details", name: "Details", description: "Allergies, NAD+ interest, and experience" },
      ],
      stepProgressMapping: [
        { stepId: "physicalActivity", progressStepId: "basics" },
        { stepId: "gender", progressStepId: "basics" },
        { stepId: "reproductiveStatus", progressStepId: "basics" },
        { stepId: "medicalConditionsNad", progressStepId: "basics" },
        { stepId: "heightWeight", progressStepId: "basics" },
        { stepId: "liverFunction", progressStepId: "health" },
        { stepId: "heartFunction", progressStepId: "health" },
        { stepId: "healthCheckup", progressStepId: "health" },
        { stepId: "smokingStatus", progressStepId: "lifestyle" },
        { stepId: "familyHistory", progressStepId: "lifestyle" },
        { stepId: "primaryCareProvider", progressStepId: "lifestyle" },
        { stepId: "allergies", progressStepId: "details" },
        { stepId: "interestInNad", progressStepId: "details" },
        { stepId: "previousNadExperience", progressStepId: "details" },
        { stepId: "nadExperienceDetails", progressStepId: "details" },
        { stepId: "selfInjectionComfort", progressStepId: "details" },
        { stepId: "additionalInfo", progressStepId: "details" },
        { stepId: "dob", progressStepId: "details" },
        { stepId: "personalInfo", progressStepId: "details" },
      ],
      steps: [...nadPlusFormSteps, ...contactFormSteps],
    };
  },

  "sermorelin": async () => {
    const { sermorelinSteps, contactFormSteps } = await import("./formSteps");
    return {
      id: "sermorelin",
      name: "Sermorelin Intake Form",
      description:
        "Medical intake form for Sermorelin therapy. Please provide complete and truthful information to help your physician determine the best treatment for you.",
      version: "1.0.0",
      progressSteps: [
        { id: "goals", name: "Goals", description: "Gender, reproductive status, desired benefits, and contraindications" },
        { id: "health", name: "Health", description: "Body metrics and current medical conditions" },
        { id: "details", name: "Details", description: "Medications, allergies, and additional info" },
      ],
      stepProgressMapping: [
        { stepId: "gender", progressStepId: "goals" },
        { stepId: "reproductiveStatus", progressStepId: "goals" },
        { stepId: "desiredBenefits", progressStepId: "goals" },
        { stepId: "medicalContraindications", progressStepId: "goals" },
        { stepId: "heightWeight", progressStepId: "health" },
        { stepId: "currentMedicalConditions", progressStepId: "health" },
        { stepId: "currentMedications", progressStepId: "details" },
        { stepId: "allergies", progressStepId: "details" },
        { stepId: "additionalInfo", progressStepId: "details" },
        { stepId: "dob", progressStepId: "details" },
        { stepId: "personalInfo", progressStepId: "details" },
      ],
      steps: [...sermorelinSteps, ...contactFormSteps],
    };
  },

  "vitamin-b12": async () => {
    const { vitaminB12Steps, contactFormSteps } = await import("./formSteps");
    return {
      id: "vitamin-b12",
      name: "Vitamin B12 Intake Form",
      description:
        "Medical intake form for Vitamin B12 injection therapy. Please provide complete and truthful information to help your physician determine the best treatment for you.",
      version: "1.0.0",
      progressSteps: [
        { id: "screening", name: "Screening", description: "B12 deficiency diagnosis and medical conditions" },
        { id: "health", name: "Health", description: "Body metrics, gender, and current conditions" },
        { id: "details", name: "Details", description: "Medications, allergies, and consultation type" },
      ],
      stepProgressMapping: [
        { stepId: "b12DeficiencyDiagnosis", progressStepId: "screening" },
        { stepId: "medicalConditions", progressStepId: "screening" },
        { stepId: "heightWeight", progressStepId: "health" },
        { stepId: "gender", progressStepId: "health" },
        { stepId: "currentMedicalConditions", progressStepId: "health" },
        { stepId: "currentMedications", progressStepId: "details" },
        { stepId: "allergies", progressStepId: "details" },
        { stepId: "additionalInfo", progressStepId: "details" },
        { stepId: "consultationType", progressStepId: "details" },
        { stepId: "dob", progressStepId: "details" },
        { stepId: "personalInfo", progressStepId: "details" },
      ],
      steps: [...vitaminB12Steps, ...contactFormSteps],
    };
  },

  "sexual-health": async () => {
    const { sexualHealthSteps, contactFormSteps } = await import("./formSteps");
    return {
      id: "sexual-health",
      name: "Sexual Health (ED) Intake Form",
      description:
        "Medical intake form for erectile dysfunction treatment. Please provide complete and truthful information to help your physician determine the best treatment for you.",
      version: "1.0.0",
      progressSteps: [
        { id: "assessment", name: "Assessment", description: "ED severity, onset, and satisfaction ratings" },
        { id: "health", name: "Health", description: "Blood pressure, heart conditions, and symptoms" },
        { id: "history", name: "History", description: "Medical history, medications, and allergies" },
        { id: "details", name: "Details", description: "Additional information and provider notes" },
      ],
      stepProgressMapping: [
        { stepId: "gender", progressStepId: "assessment" },
        { stepId: "confidenceRating", progressStepId: "assessment" },
        { stepId: "erectionFrequency", progressStepId: "assessment" },
        { stepId: "erectionDuration", progressStepId: "assessment" },
        { stepId: "erectionDifficulty", progressStepId: "assessment" },
        { stepId: "intercourseSatisfaction", progressStepId: "assessment" },
        { stepId: "edOnset", progressStepId: "assessment" },
        { stepId: "sexLifeSatisfaction", progressStepId: "assessment" },
        { stepId: "edMedicationHistory", progressStepId: "assessment" },
        { stepId: "previousMedications", progressStepId: "assessment" },
        { stepId: "bloodPressureHistory", progressStepId: "health" },
        { stepId: "heartConditions", progressStepId: "health" },
        { stepId: "symptoms", progressStepId: "health" },
        { stepId: "medicalConditions", progressStepId: "health" },
        { stepId: "recreationalDrugs", progressStepId: "health" },
        { stepId: "currentMedicalConditions", progressStepId: "history" },
        { stepId: "contraindicatedMedications", progressStepId: "history" },
        { stepId: "currentMedications", progressStepId: "history" },
        { stepId: "allergies", progressStepId: "history" },
        { stepId: "additionalInfo", progressStepId: "details" },
        { stepId: "providerMessage", progressStepId: "details" },
        { stepId: "edEducation", progressStepId: "details" },
        { stepId: "dob", progressStepId: "details" },
        { stepId: "personalInfo", progressStepId: "details" },
      ],
      steps: [...sexualHealthSteps, ...contactFormSteps],
    };
  },

  "womens-hrt": async () => {
    const { womensHRTFormSteps, contactFormSteps } = await import("./formSteps");
    return {
      id: "womens-hrt",
      name: "Women's Hormone Replacement Therapy Intake Form",
      description:
        "Medical intake form for women's hormone replacement therapy (BHRT). Please provide complete and truthful information to help your physician determine the best treatment for you.",
      version: "1.0.0",
      progressSteps: [
        { id: "basics", name: "Basics", description: "Body metrics, menstrual status, and symptoms" },
        { id: "history", name: "History", description: "Previous HRT, pregnancy, and medical conditions" },
        { id: "health", name: "Health", description: "Conditions, medications, allergies, and lifestyle" },
        { id: "eligibility", name: "Eligibility", description: "Consents, documents, and consultation type" },
      ],
      stepProgressMapping: [
        { stepId: "heightWeight", progressStepId: "basics" },
        { stepId: "gender", progressStepId: "basics" },
        { stepId: "womensHRTMenstrualStatus", progressStepId: "basics" },
        { stepId: "womensHRTSymptoms", progressStepId: "basics" },
        { stepId: "womensHRTPreviousHRT", progressStepId: "history" },
        { stepId: "pregnancy", progressStepId: "history" },
        { stepId: "womensHRTMedicalConditions", progressStepId: "history" },
        { stepId: "womensHRTCurrentConditions", progressStepId: "health" },
        { stepId: "womensHRTMedications", progressStepId: "health" },
        { stepId: "womensHRTAllergies", progressStepId: "health" },
        { stepId: "womensHRTLifestyle", progressStepId: "health" },
        { stepId: "womensHRTConsents", progressStepId: "eligibility" },
        { stepId: "womensHRTFileUploads", progressStepId: "eligibility" },
        { stepId: "womensHRTConsultationType", progressStepId: "eligibility" },
        { stepId: "dob", progressStepId: "eligibility" },
        { stepId: "personalInfo", progressStepId: "eligibility" },
      ],
      steps: [...womensHRTFormSteps, ...contactFormSteps],
    };
  },

  "mens-hrt": async () => {
    const { mensHRTFormSteps, contactFormSteps } = await import("./formSteps");
    return {
      id: "mens-hrt",
      name: "Men's Testosterone Replacement Therapy Intake Form",
      description:
        "Medical intake form for men's testosterone replacement therapy (TRT). Please provide complete and truthful information to help your physician determine the best treatment for you.",
      version: "1.0.0",
      progressSteps: [
        { id: "basics", name: "Basics", description: "Body metrics, symptoms, and testosterone history" },
        { id: "health", name: "Health", description: "Fertility, health conditions, and current conditions" },
        { id: "details", name: "Details", description: "Medications, allergies, surgeries, and lifestyle" },
        { id: "eligibility", name: "Eligibility", description: "Consultation type and consents" },
      ],
      stepProgressMapping: [
        { stepId: "gender", progressStepId: "basics" },
        { stepId: "heightWeight", progressStepId: "basics" },
        { stepId: "hrtSymptoms", progressStepId: "basics" },
        { stepId: "hrtTestosteroneHistory", progressStepId: "basics" },
        { stepId: "hrtFertility", progressStepId: "health" },
        { stepId: "hrtHealthConditions", progressStepId: "health" },
        { stepId: "hrtCurrentConditions", progressStepId: "health" },
        { stepId: "hrtMedications", progressStepId: "details" },
        { stepId: "hrtAllergies", progressStepId: "details" },
        { stepId: "hrtSurgeries", progressStepId: "details" },
        { stepId: "hrtLifestyle", progressStepId: "details" },
        { stepId: "hrtConsultationType", progressStepId: "eligibility" },
        { stepId: "hrtConsents", progressStepId: "eligibility" },
        { stepId: "dob", progressStepId: "eligibility" },
        { stepId: "personalInfo", progressStepId: "eligibility" },
      ],
      steps: [...mensHRTFormSteps, ...contactFormSteps],
    };
  },

  "glutathione": async () => {
    const { glutathioneSteps, contactFormSteps } = await import("./formSteps");
    return {
      id: "glutathione",
      name: "Glutathione Intake Form",
      description:
        "Medical intake form for glutathione supplementation. Please provide complete and truthful information to help your physician determine the best treatment for you.",
      version: "1.0.0",
      progressSteps: [
        { id: "basics", name: "Basics", description: "Body metrics, reproductive status, and medical conditions" },
        { id: "goals", name: "Goals", description: "Reasons for glutathione interest" },
        { id: "details", name: "Details", description: "Medications, allergies, and additional info" },
      ],
      stepProgressMapping: [
        { stepId: "heightWeight", progressStepId: "basics" },
        { stepId: "gender", progressStepId: "basics" },
        { stepId: "reproductiveStatus", progressStepId: "basics" },
        { stepId: "medicalConditions", progressStepId: "basics" },
        { stepId: "glutathioneInterest", progressStepId: "goals" },
        { stepId: "currentMedicalConditions", progressStepId: "goals" },
        { stepId: "currentMedications", progressStepId: "details" },
        { stepId: "allergies", progressStepId: "details" },
        { stepId: "additionalInfo", progressStepId: "details" },
        { stepId: "dob", progressStepId: "details" },
        { stepId: "personalInfo", progressStepId: "details" },
      ],
      steps: [...glutathioneSteps, ...contactFormSteps],
    };
  },

  "methylene-blue": async () => {
    const { methyleneBlueFormSteps, contactFormSteps } = await import("./formSteps");
    return {
      id: "methylene-blue",
      name: "Methylene Blue Intake Form",
      description:
        "Medical intake form for methylene blue therapy. Please provide complete and truthful information to help your physician determine the best treatment for you.",
      version: "1.0.0",
      progressSteps: [
        { id: "basics", name: "Basics", description: "Body metrics, gender, and reproductive status" },
        { id: "health", name: "Health", description: "Medical conditions and interest in methylene blue" },
        { id: "details", name: "Details", description: "Medications, allergies, and allergy screening" },
        { id: "eligibility", name: "Eligibility", description: "ID upload and personal information" },
      ],
      stepProgressMapping: [
        { stepId: "heightWeight", progressStepId: "basics" },
        { stepId: "gender", progressStepId: "basics" },
        { stepId: "reproductiveStatus", progressStepId: "basics" },
        { stepId: "medicalConditions", progressStepId: "health" },
        { stepId: "methyleneBlueInterest", progressStepId: "health" },
        { stepId: "currentMedicalConditions", progressStepId: "health" },
        { stepId: "currentMedications", progressStepId: "details" },
        { stepId: "allergies", progressStepId: "details" },
        { stepId: "methyleneBlueAllergy", progressStepId: "details" },
        { stepId: "idUpload", progressStepId: "eligibility" },
        { stepId: "dob", progressStepId: "eligibility" },
        { stepId: "personalInfo", progressStepId: "eligibility" },
      ],
      steps: [...methyleneBlueFormSteps, ...contactFormSteps],
    };
  },
};

// Available quiz IDs (synchronous — no heavy data loaded)
export const availableQuizIds: string[] = Object.keys(quizLoaders);

/**
 * Lazily loads and caches a quiz config by ID.
 * The 3,300-line formSteps module is only fetched when a quiz is first requested,
 * keeping it out of the initial bundle.
 */
export async function getQuizById(quizId: string): Promise<QuizConfig | undefined> {
  const cached = quizCache.get(quizId);
  if (cached) return cached;

  const loader = quizLoaders[quizId];
  if (!loader) return undefined;

  const config = await loader();
  quizCache.set(quizId, config);
  return config;
}

// Helper function to get progress step for a specific form step
export function getProgressStepForFormStep(
  quizConfig: QuizConfig,
  formStepId: string,
): string | undefined {
  const mapping = quizConfig.stepProgressMapping.find(
    (mapping) => mapping.stepId === formStepId,
  );
  return mapping?.progressStepId;
}

export function getFormStepsForProgressStep(
  quizConfig: QuizConfig,
  progressStepId: string,
): string[] {
  return quizConfig.stepProgressMapping
    .filter((mapping) => mapping.progressStepId === progressStepId)
    .map((mapping) => mapping.stepId);
}
