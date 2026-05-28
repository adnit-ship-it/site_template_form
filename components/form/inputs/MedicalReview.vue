<template>
    <div>
        <!-- Calculated Values Display - Outside white container -->
        <div class="text-center mb-8">
            <div class="space-y-2 text-gray-700 mb-4">
                <p class="text-lg">BMI: {{ calculatedValues.bmi }}</p>
                <p class="text-lg">Current Weight: {{ calculatedValues.currentWeight }}</p>
            </div>
            
            <!-- Candidate Statement -->
            <p class="text-gray-700">
                {{ question.candidateStatement }}
            </p>
        </div>

        <!-- Form Fields -->
        <div class="bg-white rounded-xl p-10 md:p-14">
            <h2 class="font-bold text-xl text-bodyColor mb-6">
                Let's proceed to check your eligibility.
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- First Name -->
                <div>
                    <label for="firstName" class="block text-base font-medium text-bodyColor mb-2">
                        First Name
                    </label>
                    <input 
                        id="firstName" 
                        type="text" 
                        :value="formAnswers.firstName" 
                        @input="updateValue('firstName', $event)"
                        class="form-input"
                        placeholder="Enter first name"
                    >
                </div>

                <!-- Last Name -->
                <div>
                    <label for="lastName" class="block text-base font-medium text-bodyColor mb-2">
                        Last Name
                    </label>
                    <input 
                        id="lastName" 
                        type="text" 
                        :value="formAnswers.lastName" 
                        @input="updateValue('lastName', $event)"
                        class="form-input"
                        placeholder="Enter last name"
                    >
                </div>
            </div>

            <!-- File Upload Section -->
            <div class="mt-8">
                <h3 class="font-bold text-xl text-bodyColor mb-2">
                    Please upload a government issued form of ID (Driver's License, Passport, etc.):
                </h3>
                <p class="text-gray-600 mb-4">
                    Please be sure that your full name and photo are easily visible*
                </p>
                
                <!-- File Input Component -->
                <FormInputsFileInput 
                    :question="fileQuestion"
                    :modelValue="formAnswers.passportImage || null"
                    @update:modelValue="updatePassportImage"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { calculateMedicalValues } from '~/utils/calculations';
import type { FormAnswers } from '~/types/form';

// --- TYPE DEFINITIONS ---
interface MedicalReviewQuestion {
    id: string;
    question?: string;
    type: 'MEDICAL_REVIEW';
    required: boolean;
    candidateStatement: string;
}

// --- PROPS & EMITS ---
const props = defineProps<{
    question: MedicalReviewQuestion;
    formAnswers: FormAnswers;
}>();

const emit = defineEmits(['update:formAnswers']);

// --- COMPUTED ---
const calculatedValues = computed(() => {
    return calculateMedicalValues(props.formAnswers);
});

// Create a file question object for the FileInput component
const fileQuestion = computed(() => ({
    id: 'passportImage',
    question: 'Please upload a government issued form of ID (Driver\'s License, Passport, etc.):',
    type: 'FILE_INPUT',
    required: true,
    apiType: 'FILE'
}));

// --- METHODS ---
const updateValue = (field: string, event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('update:formAnswers', {
        ...props.formAnswers,
        [field]: target.value
    });
};

const updatePassportImage = (value: { name: string; contentType: string; data: string } | null) => {
    emit('update:formAnswers', {
        ...props.formAnswers,
        passportImage: value
    });
};
</script>

<style scoped>
.form-input {
    @apply block w-full border border-gray-200 bg-gray-50 px-4 h-12 text-lg appearance-none focus:outline-none focus:ring-2 focus:ring-accentColor1 transition-colors duration-200;
}
</style> 