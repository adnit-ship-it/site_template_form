<template>
    <div>
        <!-- Image (if provided) -->
        <div v-if="question.image" class="mb-8">
            <NuxtImg format="webp" quality="75"
                :src="question.image" 
                :alt="question.question || 'Question image'" 
                class="w-full max-w-md mx-auto rounded-xl"
            />
        </div>

        <label v-if="displayText" :for="question.id" class="block text-base font-medium text-bodyColor mb-2">
            {{ displayText }}
        </label>
        
        <div class="flex gap-4">
            <label v-for="option in options" :key="option" class="yes-no-button"
                :class="{ 'selected': isChecked(option) }"
                @pointerdown="markPointerInteraction"
                @keydown="(e: KeyboardEvent) => handleKeydown(e, option)">
                <input 
                    type="radio" 
                    :name="question.id" 
                    :value="option" 
                    :checked="isChecked(option)" 
                    @change="handleChange(option)" 
                    class="sr-only"
                >
                <div class="radio-indicator">
                    <div class="radio-dot"></div>
                </div>
                <span class="button-text">{{ option }}</span>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue';
import type { SelectOption } from '~/types/form';
import { getOptionLabel } from '~/types/form';

interface YesNoQuestion {
    id: string;
    question?: string;
    displayQuestion?: string;
    type: 'YESNO';
    options: SelectOption[];
    required?: boolean;
    image?: string;
}

const props = defineProps<{
    question: YesNoQuestion;
    modelValue: string | null;
    formAnswers?: any;
    stepQuestions?: any[];
}>();

const emit = defineEmits(['update:modelValue', 'autoAdvance']);

const options = computed(() => props.question.options.map(getOptionLabel));

const displayText = computed(() => {
    return props.question.displayQuestion || props.question.question;
});

const isChecked = (option: string) => {
    return props.modelValue === option;
};

const getVisibleQuestionsCount = () => {
    if (!props.stepQuestions || !props.formAnswers) return 0;
    
    return props.stepQuestions.filter((q: any) => {
        if (!q.renderCondition) return true;
        return q.renderCondition(props.formAnswers);
    }).length;
};

let advanceOnNextChange = false;

const markPointerInteraction = () => {
    advanceOnNextChange = true;
};

const handleKeydown = (event: KeyboardEvent, optionLabel: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
        if (props.modelValue === optionLabel) {
            autoAdvance();
            return;
        }
        advanceOnNextChange = true;
        requestAnimationFrame(() => { advanceOnNextChange = false; });
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        advanceOnNextChange = false;
    }
};

const handleChange = async (option: string) => {
    emit('update:modelValue', option);

    if (advanceOnNextChange) {
        advanceOnNextChange = false;
        return await autoAdvance();
    }
};

const autoAdvance = async () => {
    await nextTick();
    setTimeout(() => {
        const visibleCount = getVisibleQuestionsCount();
        if (visibleCount === 1) {
            emit('autoAdvance');
        }
    }, 150);
};
</script>

<style scoped>
.yes-no-button {
    @apply flex items-center gap-3 px-2 md:px-4 h-10 md:h-12 bg-gray-50 border rounded-xl border-[#d9d9d9] cursor-pointer transition-all duration-200 hover:border-accentColor1/70 flex-1;
}

.yes-no-button.selected {
    @apply border-accentColor1 bg-white;
}

.yes-no-button:has(:focus-visible) {
    @apply ring-2 ring-accentColor1 ring-offset-2 border-accentColor1;
}

.radio-indicator {
    @apply w-5 h-5 rounded-full border border-[#d9d9d9] flex items-center justify-center flex-shrink-0 transition-all duration-200;
}

.yes-no-button:hover .radio-indicator {
    @apply border-accentColor1/70;
}

.yes-no-button.selected .radio-indicator {
    @apply border-accentColor1;
}

.radio-dot {
    @apply w-3 h-3 rounded-full;
}

.yes-no-button.selected .radio-dot {
    @apply bg-accentColor1;
}

.button-text {
    @apply text-sm md:text-lg font-medium text-bodyColor;
}
</style>
