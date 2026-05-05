<template>
    <div class="pt-4 lg:pt-8 w-full">
        <!-- Optional image above the header -->
        <div v-if="stepData?.image" class="mb-6">
            <NuxtImg
                :src="stepData.image" 
                :alt="stepData.heading || 'Step image'"
                class="w-full h-auto rounded-xl"
                format="webp" quality="80"
            />
        </div>

        <!-- Renders the dynamic headings for the current step's data -->
        <!-- Use v-html so headings can include HTML tags (e.g., <br>, <span>, emphasis) -->
        <h2 v-if="stepData?.heading"
            class="text-2xl md:text-[32px] leading-[24px] md:leading-[34px]"
            v-html="stepData.heading">
        </h2>
        <p v-if="stepData?.subtext"
            class="mt-6 font-normal text-sm md:text-base text-bodyColor mx-auto">
            {{ stepData.subtext }}
        </p>
    </div>
</template>

<script setup lang="ts">
// This component accepts a single prop, 'stepData', which contains
// all the information for the current step, including the headings.
defineProps({
    stepData: {
        type: Object,
        default: () => ({}) // Provide a default empty object to prevent errors on initial render
    }
});
</script>