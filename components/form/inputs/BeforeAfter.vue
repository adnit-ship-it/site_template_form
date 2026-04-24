<template>
    <div class="text-center w-full flex flex-col items-center gap-6">
        <p v-if="question.question" class="text-bodyColor text-center" v-html="`&quot;${question.question}&quot;`">
        </p>
        <NuxtImg v-if="question.image" :src="question.image" alt="Before After" format="webp" quality="75"
            class="mx-auto mb-4 h-[304px] w-[304px] object-cover rounded-2xl overflow-hidden"/>
    </div>
</template>

<script setup lang="ts">
// --- TYPE DEFINITIONS ---
interface BeforeAfterQuestion {
    image?: string;
    question?: string;
}

// --- PROPS ---
defineProps<{
    question: BeforeAfterQuestion;
}>();
</script>
