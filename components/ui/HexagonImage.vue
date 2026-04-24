<template>
  <div :class="wrapperClass" class="hexagon-wrapper">
    <img
      v-if="showBackground"
      :src="maskImage"
      alt=""
      class="hexagon-background"
    />
    <div class="hexagon-image-container" :style="containerMaskStyle">
      <img :src="src" :alt="alt" class="hexagon-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  src: string;
  backgroundImage?: string;
  alt?: string;
  class?: string;
  variant?: "default" | "flipped";
  showBackground?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  backgroundImage: "/assets/images/hexagons/background.png",
  variant: "default",
  showBackground: true,
});

const maskImage = computed(() => {
  return props.backgroundImage || "/assets/images/hexagons/background.png";
});

const containerMaskStyle = computed(() => ({
  maskImage: `url(${maskImage.value})`,
  WebkitMaskImage: `url(${maskImage.value})`,
}));

const wrapperClass = computed(() => {
  const baseSizing =
    props.variant === "flipped"
      ? "w-[176px] h-[202px] md:w-[220px] md:h-[250px] lg:w-[263px] lg:h-[304px]"
      : "w-[202px] h-[176px] md:w-[250px] md:h-[220px] lg:w-[304px] lg:h-[263px]";
  const base = `${baseSizing} overflow-hidden pointer-events-auto relative flex-shrink-0`;
  return props.class ? `${base} ${props.class}` : base;
});
</script>

<style scoped>
.hexagon-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 1;
  pointer-events: none;
}

.hexagon-image-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  overflow: hidden;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.hexagon-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  transform-origin: center bottom;
  transition: transform 300ms ease-in-out;
}

.hexagon-wrapper:hover .hexagon-image {
  transform: scale(1.05);
}
</style>
