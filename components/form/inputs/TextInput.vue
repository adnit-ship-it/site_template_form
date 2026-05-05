<template>
    <div>
        <label v-if="displayText" :for="question.id" class="block text-base text-bodyColor mb-2">
            {{ displayText }}
        </label>
        <div class="relative">
            <input 
                ref="inputEl"
                :id="question.id" 
                :type="question.type" 
                :inputmode="question.inputmode ?? (question.numbersOnly || question.type === 'number' ? 'numeric' : undefined)"
                :value="modelValue" 
                @input="updateValue" 
                @blur="handleBlur"
                class="form-input"
                :style="question.icon ? 'padding-left: 36px;' : ''"
                :class="{ 
                    'border-red-500 focus:ring-red-500': hasError
                }"
                :placeholder="question.placeholder"
                :maxlength="question.maxLength"
                :aria-describedby="`${question.id}-error`"
                :aria-invalid="hasError"
                @wheel="($event.target as HTMLInputElement)?.blur()"
            >
            
            <!-- Icon (if provided) -->
            <div v-if="question.icon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <img :src="question.icon" :alt="`${question.question} icon`" class="h-5 w-5 text-bodyColor" />
            </div>
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

interface InputQuestion {
    id: string;
    question?: string;
    displayQuestion?: string;
    type: 'text' | 'number' | 'email' | 'tel';
    inputmode?: 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none';
    placeholder?: string;
    required: boolean;
    validation?: ValidationRule[];
    icon?: string;
    minValue?: number;
    maxValue?: number;
    maxLength?: number;
    numbersOnly?: boolean;
}

const props = defineProps<{
    question: InputQuestion;
    modelValue: string | number | null;
    formAnswers?: any;
}>();

const emit = defineEmits(['update:modelValue']);

const inputEl = ref<HTMLInputElement | null>(null);
const hasError = ref(false);
const errorMessage = ref('');
const touched = ref(false);

const displayText = computed(() => {
    return props.question.displayQuestion || props.question.question;
});

const validationRules = computed(() => {
    const rules: ValidationRule[] = [];
    
    if (props.question.required) {
        rules.push({ type: 'required', message: 'This field is required' });
    }
    
    if (props.question.validation) {
        rules.push(...props.question.validation);
    }
    
    return rules;
});

const isNumericText = computed(() =>
    props.question.type === 'text' &&
    props.question.inputmode === 'numeric' &&
    (props.question.minValue !== undefined || props.question.maxValue !== undefined)
);

const clampToRange = (num: number): number => {
    let v = num;
    if (props.question.minValue !== undefined && v < props.question.minValue) v = props.question.minValue;
    if (props.question.maxValue !== undefined && v > props.question.maxValue) v = props.question.maxValue;
    return v;
};

const updateValue = (event: Event) => {
    const target = event.target as HTMLInputElement;
    let rawStr = target.value;

    if (props.question.numbersOnly) {
        const cleaned = rawStr.replace(/\D/g, '');
        if (cleaned !== rawStr) {
            rawStr = cleaned;
            target.value = cleaned;
        }
    }

    if (props.question.type === 'number' && props.question.maxLength && rawStr.length > props.question.maxLength) {
        rawStr = rawStr.slice(0, props.question.maxLength);
        target.value = rawStr;
    }

    let value: string | number = rawStr;

    if (props.question.type === 'number') {
        const num = rawStr === '' ? NaN : Number(rawStr);
        if (!isNaN(num) && props.question.maxLength && rawStr.length >= props.question.maxLength) {
            const clamped = clampToRange(num);
            if (clamped !== num) {
                rawStr = String(clamped);
                target.value = rawStr;
            }
            value = clamped;
        } else {
            value = isNaN(num) ? NaN : num;
        }
    } else if (isNumericText.value) {
        const num = rawStr === '' ? NaN : Number(rawStr);
        if (!isNaN(num) && props.question.maxLength && rawStr.length >= props.question.maxLength) {
            const clamped = clampToRange(num);
            if (clamped !== num) {
                rawStr = String(clamped);
                target.value = rawStr;
            }
            value = rawStr;
        }
    }

    emit('update:modelValue', value);

    if (!touched.value) touched.value = true;
    validateField();

    if (props.question.maxLength && rawStr.length >= props.question.maxLength && inputEl.value) {
        const allInputs = Array.from(
            document.querySelectorAll<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
        );
        const currentIndex = allInputs.indexOf(inputEl.value);
        if (currentIndex !== -1 && currentIndex + 1 < allInputs.length) {
            allInputs[currentIndex + 1]?.focus();
        }
    }
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

watch(() => props.modelValue, () => {
    if (touched.value) {
        validateField();
    }
}, { immediate: false });

watch(() => props.formAnswers, () => {
    if (touched.value) {
        validateField();
    }
}, { deep: true });

const handleBlur = () => {
    touched.value = true;

    const isNumber = props.question.type === 'number';
    if ((isNumber || isNumericText.value) && props.modelValue !== null && props.modelValue !== '') {
        const strValue = String(props.modelValue);
        const shouldClamp = isNumber || !props.question.maxLength || strValue.length >= props.question.maxLength;
        if (shouldClamp) {
            const numValue = Number(props.modelValue);
            if (!isNaN(numValue)) {
                const clamped = clampToRange(numValue);
                if (clamped !== numValue) {
                    emit('update:modelValue', isNumber ? clamped : String(clamped));
                }
            }
        }
    }

    validateField();
};
</script>

<style scoped>
.form-input {
    @apply block w-full border rounded-[6px] border-[#d9d9d9] px-2 md:px-4 h-[42px] md:h-12 text-base md:text-lg appearance-none focus:outline-none focus:border-accentColor1 transition-colors duration-200;
}

.form-input::-webkit-outer-spin-button,
.form-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type=number] {
    -moz-appearance: textfield;
}
</style>
