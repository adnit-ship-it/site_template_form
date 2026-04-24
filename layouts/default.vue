<template>
  <div class="min-h-screen bg-white flex flex-col font-bodyFont">
    <LayoutNavbar hideNavigation />
    <main class="mx-auto w-full max-w-full pt-[var(--header-offset)]">
      <div class="">
        <slot />
      </div>
    </main>
    <LayoutFooter />
  </div>
</template>

<script setup lang="ts">
// Import our new state management composables
import { useFormSteps, useCurrentFormStep } from "~/composables/useFormState";

// Get the shared state. The local ref() definitions have been removed.
const progressSteps = useFormSteps();
const currentFormStep = useCurrentFormStep();
</script>
