<template>
  <div class="w-full max-w-[668px] mx-auto px-4 py-12">
    <div class="rounded-[24px] bg-white py-20 px-10 text-center">
      <h1 class="text-[32px] leading-[38px] font-medium text-bodyColor">
        {{ title }}
      </h1>

      <p class="mt-6 text-[18px] leading-[28px] font-medium text-bodyColor">
        {{ subtitle }}
      </p>

      <div class="mt-8 flex flex-col gap-3">
        <!-- Back to quiz button (optional) -->
        <button
          v-if="showBackButton"
          @click="emit('back')"
          class="w-full py-3 border border-[#666666] text-bodyColor font-medium text-[16px] leading-[24px] rounded-[10px] transition-colors"
        >
          Back to quiz
        </button>

        <!-- Shop button -->
        <a
          :href="buttonUrl"
          @click.prevent="emit('shop-more', buttonUrl)"
          class="block w-full py-3 bg-accentColor1 text-white font-medium text-[16px] leading-[24px] rounded-[10px] hover:bg-accentColor1/90 transition-colors"
        >
          {{ buttonText }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonUrl?: string;
    showBackButton?: boolean;
  }>(),
  {
    title: "We're sorry, you're not eligible at this time",
    subtitle:
      "If you think this might be an error, please return to the intake form and check that all of your selections apply to you.",
    buttonText: "Back to home",
    buttonUrl: "/",
    showBackButton: false,
  }
);

const emit = defineEmits<{ back: []; "shop-more": [url: string] }>();
</script>
