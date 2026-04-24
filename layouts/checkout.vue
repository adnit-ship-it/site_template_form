<template>
  <div class="min-h-screen bg-backgroundColor flex flex-col">
    <LayoutNavbar :logoOnly="true" :centerLogo="true" :hideTopBar="true" background="bg-[#EBF2F1]" :showTrustpilot="true" />
    <main class="flex-1 pt-[var(--site-header-offset)]">
      <slot />
    </main>
    <!-- <LayoutFooter /> -->
  </div>
</template>

<script setup>
// Checkout layout with white body and tinted navbar
</script>

<style scoped></style>
