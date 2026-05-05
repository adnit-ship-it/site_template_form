<template>
    <div>
        <label v-if="displayText" :for="question.id" class="block text-base font-medium text-bodyColor mb-6"
            :class="{ 'text-left md:text-center': !shouldDisplayAsRow }">{{ displayText }}</label>

        <!-- Renders MULTISELECT as simple checkbox list -->
        <div v-if="shouldDisplayAsRow && question.type === 'MULTISELECT'" class="w-full flex flex-col gap-3">
            <label v-for="option in question.options" :key="label(option)" class="multiselect-checkbox-label">
                <input type="checkbox" :name="question.id"
                    :value="label(option)" :checked="isChecked(label(option))" @change="handleChange(label(option))" class="multiselect-checkbox">
                <span class="text-bodyColor text-sm md:text-base" v-html="label(option)"></span>
            </label>
        </div>

        <!-- Renders SINGLESELECT as custom rows -->
        <div v-else-if="shouldDisplayAsRow" 
            :class="[
                'w-full gap-2 text-sm md:text-base',
                question.optionRowLayout ? 'grid' : 'flex flex-col',
                question.optionRowLayout ? {
                    'md:grid-cols-1': desktopChunkSize === 1,
                    'md:grid-cols-2': desktopChunkSize === 2,
                    'md:grid-cols-3': desktopChunkSize === 3,
                    'md:grid-cols-4': desktopChunkSize === 4,
                } : {}
            ]"
            :style="question.optionRowLayout ? {
                gridTemplateColumns: `repeat(${mobileChunkSize}, minmax(0, 1fr))`
            } : {}"
        >
            <label v-for="option in question.options" :key="label(option)" class="row-select-label"
                @pointerdown="markPointerInteraction" @keydown="(e: KeyboardEvent) => handleKeydown(e, label(option))">
                <input type="radio" :name="question.id"
                    :value="label(option)" :checked="isChecked(label(option))" @change="handleChange(label(option))" class="sr-only">
                <div class="custom-radio-like-indicator mr-1.5 md:mr-3 flex-shrink-0"></div>

                <!-- Option Image -->
                <div v-if="img(option)"
                    class="flex items-center justify-center mr-3">
                    <NuxtImg :src="img(option)!" :alt="label(option)" format="webp" quality="80"
                        class="max-w-[24px] md:max-w-[42px] max-h-[24px] md:max-h-[42px] object-contain"/>
                </div>

                <span class="text-bodyColor" v-html="label(option)"></span>
            </label>
        </div>

        <!-- Renders the options as clickable boxes -->
        <div v-else class="mt-2 flex flex-col items-center gap-4">
            <div v-if="question.optionRowLayout" class="grid gap-6 justify-center" :style="{
                gridTemplateColumns: `repeat(${mobileChunkSize}, minmax(0, 1fr))`
            }" :class="{
                    'md:grid-cols-1': desktopChunkSize === 1,
                    'md:grid-cols-2': desktopChunkSize === 2,
                    'md:grid-cols-3': desktopChunkSize === 3,
                    'md:grid-cols-4': desktopChunkSize === 4,
                }">
                <label v-for="option in question.options" :key="label(option)" class="box-select-label"
                    @pointerdown="markPointerInteraction" @keydown="(e: KeyboardEvent) => handleKeydown(e, label(option))">
                    <input :type="question.type === 'SINGLESELECT' ? 'radio' : 'checkbox'" :name="question.id"
                        :value="label(option)" :checked="isChecked(label(option))" @change="handleChange(label(option))" class="sr-only">
                    <div
                        class="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-bodyColor flex items-center justify-center">
                        <div class="w-2.5 h-2.5 rounded-full"></div>
                    </div>

                    <!-- Option Image -->
                    <div v-if="img(option)"
                        class="flex-1 flex items-center justify-center mb-2">
                        <NuxtImg :src="img(option)!" :alt="label(option)" format="webp" quality="80"
                            class="max-w-[32px] md:max-w-[56px] max-h-[32px] md:max-h-[56px] object-contain"/>
                    </div>

                    <span class="text-center font-semibold text-bodyColor text-sm md:text-xl" v-html="label(option)"></span>
                </label>
            </div>
            <div v-else v-for="(row, rowIndex) in chunkedOptions" :key="rowIndex"
                class="flex justify-center flex-wrap gap-6">
                <label v-for="option in row" :key="label(option)" class="box-select-label"
                    @pointerdown="markPointerInteraction" @keydown="(e: KeyboardEvent) => handleKeydown(e, label(option))">
                    <input :type="question.type === 'SINGLESELECT' ? 'radio' : 'checkbox'" :name="question.id"
                        :value="label(option)" :checked="isChecked(label(option))" @change="handleChange(label(option))" class="sr-only">
                    <div
                        class="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-bodyColor flex items-center justify-center">
                        <div class="w-2.5 h-2.5 rounded-full"></div>
                    </div>

                    <!-- Option Image -->
                    <div v-if="img(option)"
                        class="flex-1 flex items-center justify-center mb-2">
                        <NuxtImg :src="img(option)!" :alt="label(option)" format="webp" quality="80"
                            class="max-w-[32px] md:max-w-[56px] max-h-[32px] md:max-h-[56px] object-contain"/>
                    </div>

                    <span class="text-center font-semibold text-bodyColor text-sm md:text-xl" v-html="label(option)"></span>
                </label>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick } from 'vue';
import type { SelectOption } from '~/types/form';
import { getOptionLabel, getOptionImg } from '~/types/form';

interface SelectQuestion {
    id: string;
    question?: string;
    displayQuestion?: string;
    type: 'SINGLESELECT' | 'MULTISELECT';
    options: SelectOption[];
    displayAsRow?: boolean;
    optionRowLayout?: [number, number];
}

const props = defineProps<{
    question: SelectQuestion;
    modelValue: string | string[] | null;
    formAnswers?: any;
    stepQuestions?: any[];
}>();

const emit = defineEmits(['update:modelValue', 'autoAdvance']);

const label = getOptionLabel;
const img = getOptionImg;

let advanceOnNextChange = false;

const displayText = computed(() => {
    return props.question.displayQuestion || props.question.question;
});

const shouldDisplayAsRow = computed(() => {
    if (props.question.optionRowLayout) {
        return true;
    }
    return true;
});

const mobileChunkSize = computed(() => {
    return props.question.optionRowLayout ? props.question.optionRowLayout[0] : 3;
});

const desktopChunkSize = computed(() => {
    return props.question.optionRowLayout ? props.question.optionRowLayout[1] : 3;
});

const isChecked = (optionLabel: string) => {
    if (props.question.type === 'SINGLESELECT') {
        return props.modelValue === optionLabel;
    }
    return Array.isArray(props.modelValue) && props.modelValue.includes(optionLabel);
};

const getVisibleQuestionsCount = () => {
    if (!props.stepQuestions || !props.formAnswers) return 0;
    
    return props.stepQuestions.filter((q: any) => {
        if (!q.renderCondition) return true;
        return q.renderCondition(props.formAnswers);
    }).length;
};

const markPointerInteraction = () => {
    advanceOnNextChange = true;
};

const handleKeydown = (event: KeyboardEvent, optionLabel: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
        if (props.question.type === 'SINGLESELECT' && props.modelValue === optionLabel) {
            autoAdvance();
            return;
        }
        advanceOnNextChange = true;
        requestAnimationFrame(() => { advanceOnNextChange = false; });
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        advanceOnNextChange = false;
    }
};

const handleChange = async (optionLabel: string) => {
    if (props.question.type === 'SINGLESELECT') {
        emit('update:modelValue', optionLabel);
        if (advanceOnNextChange) {
            advanceOnNextChange = false;
            return await autoAdvance();
        }
        return;
    } else {
        const currentValue = props.modelValue ? [...props.modelValue as string[]] : [];
        const index = currentValue.indexOf(optionLabel);

        if (index > -1) {
            currentValue.splice(index, 1);
        } else {
            if (isExclusiveOption(optionLabel)) {
                emit('update:modelValue', [optionLabel]);
                return await autoAdvance();
            }
            const filtered = currentValue.filter(v => !isExclusiveOption(v));
            filtered.push(optionLabel);
            emit('update:modelValue', filtered);
            return;
        }
        emit('update:modelValue', currentValue);
    }
};

const isExclusiveOption = (optionLabel: string): boolean => {
    const normalized = optionLabel.toLowerCase().trim();
    return normalized === 'none of the above' ||
           normalized === 'none of these' ||
           normalized.startsWith('none of the above') ||
           normalized.startsWith('none of these') ||
           normalized.startsWith('not sure');
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

const chunkArray = (array: any[], size: number) => {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
        chunkedArr.push(array.slice(i, i + size));
    }
    return chunkedArr;
};

const chunkedOptions = computed(() => {
    return chunkArray(props.question.options, mobileChunkSize.value);
});
</script>

<style scoped>
/* Box select styles */
.box-select-label {
    @apply relative bg-white p-4 pb-4 md:pb-10 flex flex-col justify-end items-center h-28 md:h-48 w-28 md:w-48 cursor-pointer border-2 border-bodyColor transition-colors hover:border-accentColor1 has-[:checked]:border-accentColor1;
}

.box-select-label:has(:focus-visible) {
    @apply ring-2 ring-accentColor1 ring-offset-2 border-accentColor1;
}

.box-select-label:hover .absolute {
    @apply border-accentColor1;
}

.box-select-label:has(:checked) .absolute>div {
    @apply bg-accentColor1;
}

.box-select-label:has(:checked) .absolute {
    @apply border-accentColor1;
}

/* Row select styles (SINGLESELECT) */
.row-select-label {
    @apply relative bg-white p-2 flex items-center w-full cursor-pointer border rounded-xl border-[#d9d9d9] transition-colors hover:border-accentColor1 has-[:checked]:border-accentColor1;
}

.row-select-label:has(:focus-visible) {
    @apply ring-2 ring-accentColor1 ring-offset-2 border-accentColor1;
}

.row-select-label:has(:checked) .custom-radio-like-indicator {
    @apply border-accentColor1;
}

.row-select-label:has(:checked) .custom-radio-like-indicator::after {
    @apply bg-accentColor1;
}

.row-select-label:hover .custom-radio-like-indicator {
    @apply border-accentColor1;
}

.custom-radio-like-indicator {
    @apply w-5 h-5 rounded-full border border-[#d9d9d9] flex items-center justify-center transition-all duration-200;
}

.custom-radio-like-indicator::after {
    content: '';
    @apply w-2.5 h-2.5 rounded-full;
}

/* Simple checkbox list styles (MULTISELECT) */
.multiselect-checkbox-label {
    @apply flex items-start gap-3 cursor-pointer rounded-lg;
}

.multiselect-checkbox-label:has(:focus-visible) {
    @apply ring-2 ring-accentColor1 ring-offset-2;
}

.multiselect-checkbox {
    @apply w-5 h-5 mt-0.5 flex-shrink-0 rounded border border-[#d9d9d9] cursor-pointer accent-accentColor1;
}
</style>
