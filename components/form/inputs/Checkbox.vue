<template>
    <div>
        <label v-if="displayText" :for="question.id" class="block text-base font-medium text-bodyColor mb-2">
            {{ displayText }}
        </label>

        <!-- Single checkbox option -->
        <div class="flex items-center gap-3" v-if="firstOption">
            <label class="checkbox-label cursor-pointer flex items-start gap-1.5 lg:gap-3">
                <input type="checkbox" :name="question.id" :value="firstOption" :checked="isChecked(firstOption)"
                    @change="handleChange(firstOption)" class="sr-only">
                <div class="custom-checkbox-indicator"></div>
                <span class="text-bodyColor text-sm pr-0 md:pr-8" v-html="firstOption"></span>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import type { SelectOption } from '~/types/form';
import { getOptionLabel } from '~/types/form';

interface CheckboxQuestion {
    id: string;
    question?: string;
    displayQuestion?: string;
    type: 'CHECKBOX';
    options: SelectOption[];
    displayAsRow?: boolean;
    startValue?: boolean;
}

// --- PROPS & EMITS ---
const props = defineProps<{
    question: CheckboxQuestion;
    modelValue: string | string[] | null;
}>();

const emit = defineEmits(['update:modelValue']);

// --- COMPUTED ---
const displayText = computed(() => {
    return props.question.displayQuestion || props.question.question;
});

const firstOption = computed(() => {
    const raw = props.question.options?.[0];
    return raw ? getOptionLabel(raw) : '';
});

// --- METHODS ---
// Checks if the option should be marked as checked
const isChecked = (option: string) => {
    // If modelValue is already set, use it
    if (props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '') {
        return props.modelValue === option;
    }
    // Otherwise, check if startValue is true to pre-check the checkbox
    if (props.question.startValue === true) {
        return true;
    }
    return false;
};

// Handles checkbox changes (single selection)
const handleChange = (option: string) => {
    // If the clicked option is already selected, deselect it
    if (props.modelValue === option) {
        emit('update:modelValue', null);
    } else {
        // Otherwise, select the option
        emit('update:modelValue', option);
    }
};

// Initialize checkbox value if startValue is true and modelValue is not set
onMounted(() => {
    if (props.question.startValue === true && firstOption.value) {
        // If checkbox should be pre-checked but value isn't set, set it
        if (!props.modelValue || props.modelValue === null || props.modelValue === '') {
            emit('update:modelValue', firstOption.value);
        }
    }
});

// Watch for startValue changes in case question prop updates
watch(() => props.question.startValue, (newStartValue) => {
    if (newStartValue === true && firstOption.value) {
        if (!props.modelValue || props.modelValue === null || props.modelValue === '') {
            emit('update:modelValue', firstOption.value);
        }
    }
}, { immediate: true });
</script>

<style scoped>
.checkbox-label {
    @apply relative;
}

.custom-checkbox-indicator {
    @apply min-w-4 lg:min-w-5 min-h-4 lg:min-h-5 border-2 rounded-sm border-bodyColor flex items-center justify-center transition-all duration-200;
}

.checkbox-label:has(:checked) .custom-checkbox-indicator {
    @apply border-accentColor1;
}

.checkbox-label:has(:checked) .custom-checkbox-indicator::after {
    content: '';
    @apply w-2 lg:w-2.5 h-2 lg:h-2.5 bg-accentColor1 rounded-sm;
}

.checkbox-label:hover .custom-checkbox-indicator {
    @apply border-accentColor1;
}

.checkbox-label:has(:focus-visible) {
    @apply ring-2 ring-accentColor1 ring-offset-2 rounded;
}
</style>
