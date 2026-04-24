<template>
  <div class="min-h-screen bg-backgroundColor flex flex-col">
    <LayoutNavbar :centerLogo="true" background="bg-white" :logoOnly="true" :hideTopBar="true" :showTrustpilot="true" />
    <main class="pt-[128px] flex-1">
      <slot />
    </main>
    <!-- <LayoutFooter /> -->
  </div>

</template>

<script setup>
// No additional logic required for this layout.
</script>

<style scoped></style>
