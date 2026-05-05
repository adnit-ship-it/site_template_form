<template>
  <section :class="['w-full overflow-x-hidden', outerClass]">
    <div :class="['max-w-[1340px] mx-auto px-6 md:px-8', innerClass]">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps({
  outerClass: {
    type: String,
    default: "",
  },
  innerClass: {
    type: String,
    default: "",
  },
});
</script>
