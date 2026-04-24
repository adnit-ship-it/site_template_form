<template>
    <div>
        <label v-if="displayText" :for="question.id" class="block text-base font-medium text-bodyColor mb-2">{{ displayText }}</label>
        <div class="relative">
            <select :id="question.id" :value="modelValue" @change="updateValue" class="form-input" :disabled="!computedOptions || computedOptions.length === 0">
                <!-- The value here now correctly matches the initial state -->
                <option value="">Select...</option>
                <option v-for="(option, index) in computedOptions" :key="option" :value="option">
                  {{ question.optionLabels && question.optionLabels[index] ? question.optionLabels[index] : option }}
                </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </div>
        </div>
        <p v-if="!computedOptions || computedOptions.length === 0" class="text-sm text-gray-500 mt-1">
            Please select a medication type first to see available dosages.
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

// --- TYPE DEFINITIONS ---
interface DropdownQuestion {
    id: string;
    question?: string;
    displayQuestion?: string;
    options: (string | number)[] | ((answers: any) => (string | number)[]);
    optionLabels?: string[];
}

// --- PROPS & EMITS ---
const props = defineProps<{
    question: DropdownQuestion;
    modelValue: string | number | null;
    formAnswers: any;
}>();

const emit = defineEmits(['update:modelValue']);

// --- COMPUTED ---
const displayText = computed(() => {
    return props.question.displayQuestion || props.question.question;
});

const computedOptions = computed(() => {
    // First, try to use pre-calculated options if available
    if (props.formAnswers._preCalculatedOptions && 
        props.formAnswers._preCalculatedOptions[props.question.id]) {
        return props.formAnswers._preCalculatedOptions[props.question.id];
    }
    
    // Fallback to dynamic calculation if no pre-calculated options
    if (typeof props.question.options === 'function') {
        return props.question.options(props.formAnswers);
    }
    return props.question.options;
});

// Watch for changes in computed options and reset value if current selection is invalid
// NOTE: Don't run immediately to avoid clearing valid selections on mount
watch(computedOptions, (newOptions, oldOptions) => {
    // Only reset if options actually changed (not on initial mount)
    if (oldOptions && newOptions && newOptions.length > 0 && props.modelValue) {
        // If the current value is not in the new options, reset it
        if (!newOptions.includes(props.modelValue)) {
            emit('update:modelValue', null);
        }
    }
});

// Watch for form answers changes to handle dynamic options updates
// This is now redundant since we watch computedOptions directly above
// Commenting out to avoid double-clearing the value
// watch(() => props.formAnswers, (newAnswers) => {
//     if (newAnswers && props.modelValue && computedOptions.value.length > 0) {
//         if (!computedOptions.value.includes(props.modelValue)) {
//             emit('update:modelValue', null);
//         }
//     }
// }, { deep: true });

// --- METHODS ---
// This function ensures the emitted value is correctly typed.
const updateValue = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    // Check if the option should be a number
    const selectedOption = computedOptions.value.find(opt => opt.toString() === target.value);
    const value = typeof selectedOption === 'number' ? parseFloat(target.value) : target.value;
    emit('update:modelValue', value);
};
</script>

<style scoped>
.form-input {
    @apply block w-full border rounded-xl border-[#d9d9d9] bg-gray-50 px-2 md:px-4 h-10 md:h-12 text-base md:text-lg appearance-none focus:outline-none focus:border-accentColor1;
}
</style>