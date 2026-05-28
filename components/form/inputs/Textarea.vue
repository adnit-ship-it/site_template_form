<template>
    <div>
        <label v-if="displayText" :for="question.id" class="block text-base font-medium text-bodyColor mb-2">
            {{ displayText }}
        </label>
        <div class="relative">
            <textarea 
                :id="question.id" 
                :value="modelValue" 
                @input="updateValue" 
                @blur="handleBlur"
                class="form-textarea"
                :class="{ 
                    'border-red-500 focus:ring-red-500': hasError
                }"
                :placeholder="question.placeholder"
                :aria-describedby="`${question.id}-error`"
                :aria-invalid="hasError"
                rows="3"
            ></textarea>
        </div>
        <div v-if="hasError" :id="`${question.id}-error`" class="text-red-500 text-sm mt-1">
            {{ errorMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { validateFieldWithRules } from '~/utils/validation';
import type { ValidationRule } from '~/types/form';

// --- TYPE DEFINITIONS ---
interface TextareaQuestion {
    id: string;
    question?: string;
    displayQuestion?: string;
    type: 'textarea';
    placeholder?: string;
    required: boolean;
    validation?: ValidationRule[];
}

// --- PROPS & EMITS ---
const props = defineProps<{
    question: TextareaQuestion;
    modelValue: string | null;
    formAnswers?: any;
}>();

const emit = defineEmits(['update:modelValue']);

// --- REACTIVE STATE ---
const hasError = ref(false);
const errorMessage = ref('');
const touched = ref(false);

// --- COMPUTED ---
const displayText = computed(() => {
    return props.question.displayQuestion || props.question.question;
});

const validationRules = computed(() => {
    const rules: ValidationRule[] = [];
    
    // Add required validation if the field is required
    if (props.question.required) {
        rules.push({ type: 'required', message: 'This field is required' });
    }
    
    // Add custom validation rules if provided
    if (props.question.validation) {
        rules.push(...props.question.validation);
    }
    
    return rules;
});

// --- METHODS ---
const updateValue = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    emit('update:modelValue', value);
    
    // Set touched on first interaction
    if (!touched.value) {
        touched.value = true;
    }
    
    // Validate when user starts typing
    validateField();
};

const validateField = () => {
    if (validationRules.value.length === 0) {
        hasError.value = false;
        errorMessage.value = '';
        return;
    }
    
    const result = validateFieldWithRules(props.modelValue, validationRules.value, props.formAnswers);
    hasError.value = !result.isValid;
    errorMessage.value = result.message || '';
};

// --- WATCHERS ---
// Validate when the value changes (but don't show errors until touched)
watch(() => props.modelValue, () => {
    if (touched.value) {
        validateField();
    }
}, { immediate: false });

// Validate when formAnswers change (important for cross-field validation)
watch(() => props.formAnswers, () => {
    if (touched.value) {
        validateField();
    }
}, { deep: true });

// Validate on blur for better UX
const handleBlur = () => {
    touched.value = true;
    validateField();
};
</script>

<style scoped>
.form-textarea {
    @apply block w-full border rounded-xl border-[#d9d9d9] bg-gray-50 px-2 md:px-4 py-2 md:py-3 text-base md:text-lg appearance-none focus:outline-none focus:border-accentColor1 transition-colors duration-200 resize-none;
    min-height: 3rem;
    line-height: 1.5;
}
</style>