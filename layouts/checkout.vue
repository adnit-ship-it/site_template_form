<template>
  <div class="min-h-screen bg-backgroundColor flex flex-col">
    <LayoutNavbar :logoOnly="true" :centerLogo="true" :hideTopBar="true" background="bg-[#EBF2F1]" :showTrustpilot="true" />
    <!-- Padding matches the fixed navbar height: mobile ~56px (logo 32px + py-1.5 + trustpilot),
         desktop ~116px (logo 92px + py-1.5). Extra buffer keeps content clear of the shadow line. -->
    <main class="flex-1 pt-[72px] lg:pt-[120px]">
      <slot />
    </main>
    <!-- <LayoutFooter /> -->
  </div>
</template>

<script setup>
// Checkout layout with white body and tinted navbar
</script>

<style scoped></style>
