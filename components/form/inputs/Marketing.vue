<template>
    <div class=" w-full flex flex-col items-center gap-6">
        <NuxtImg v-if="question.image" :src="question.image" alt="Marketing" format="webp" quality="75"
            class="mx-auto mb-4 w-full h-auto object-cover rounded-xl overflow-hidden"/>
        <p v-if="question.question" class="text-bodyColor" v-html="question.question">
        </p>
    </div>
</template>

<script setup lang="ts">
// --- TYPE DEFINITIONS ---
interface MarketingQuestion {
    image?: string;
    question?: string;
}

// --- PROPS ---
defineProps<{
    question: MarketingQuestion;
}>();
</script>
