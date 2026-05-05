<template>
  <NuxtLink :to="to" :class="linkClass" :target="targetType">
    <button :class="buttonClass">
      {{ label }}
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4  ml-2" v-if="showArrow">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path d="M5 12H19M19 12L13 6M19 12L13 18" :stroke="arrowColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round"></path>
        </g>
      </svg>
    </button>
  </NuxtLink>
</template>

<script setup lang="ts">
import {computed} from "vue";

interface Props {
  color?: "accentColor1" | "accentColor2" | "transparent";
  label: string;
  to?: string;
  class?: string;
  linkClass?: string;
  showAnimation?: boolean;
  showArrow?: boolean;
  arrowColor?: string;
  targetType?: '_blank' | '_self';
}

const props = withDefaults(defineProps<Props>(), {
  color: "accentColor1",
  showAnimation: false,
  showArrow: false,
  arrowColor: '#ffffff',
  targetType: "_self",
});

const buttonClass = computed(() => {
  const baseClasses =
      "rounded-full flex justify-center items-center text-white py-2 uppercase text-[13px] h-[40px]";
  const colorClass = props.showAnimation ? "" : `bg-${props.color}`;
  const animationClass = props.showAnimation ? "button-slide-hover" : "";
  const additionalClasses = props.class || "";

  return `${baseClasses} ${colorClass} ${animationClass} ${additionalClasses}`.trim();
});

const linkClass = computed(() => props.linkClass || "");
</script>

<style scoped>
.button-slide-hover {
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: all .3s;
}

.button-slide-hover:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #092D72;
  border-radius: 10rem;
  z-index: -2;
}

.button-slide-hover:before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0%;
  height: 100%;
  background-color: #38558C;
  transition: all .3s;
  border-radius: 10rem;
  z-index: -1;
}

.button-slide-hover:hover:before {
  width: 100%;
}
</style>
