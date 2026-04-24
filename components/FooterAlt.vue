<template>
  <footer class="lg:h-[192px] flex px-6 relative rounded-t-xl overflow-hidden footer-gradient">
    <div
      class="max-w-[1234px] w-full mx-auto relative z-10 flex flex-col gap-6 lg:gap-0 lg:flex-row justify-between py-8 lg:pt-[52px]">
      <div class="flex lg:flex-row items-center gap-3 lg:gap-4 justify-center">
        <NuxtLink to="/">
          <img src="/assets/images/brand/logo-alt.svg" alt="Brand Logo" class="h-12 lg:h-20 w-auto">
        </NuxtLink>
        <!-- <a href="https://www.legitscript.com/websites/?checker_keywords=altrx.com" target="_blank"
          title="Verify LegitScript Approval for www.altrx.com">
          <img src="https://static.legitscript.com/seals/48475686.png" alt="Verify Approval for www.altrx.com"
            width="73" height="79" />
        </a> -->
        <div class="flex gap-3 lg:gap-4">
          <img src="/assets/images/icons/hipaa.png" alt="HIPAA Compliant" class="h-[80px]">
          <img src="/assets/images/icons/made-usa.jpg" alt="Made in USA" class="h-[80px]">
        </div>
      </div>
      <div class="flex flex-col items-center lg:items-start lg:flex-row gap-6 lg:gap-16">
        <div class="flex w-full lg:w-fit items-start gap-4 lg:flex-col text-black">
          <NuxtLink to="/" class="hover:text-accentColor1 transition-colors">
            Home
          </NuxtLink>
          <NuxtLink to="/welcome" class="hover:text-accentColor1 transition-colors">
            Welcome
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// Component logic can be added here
</script>

<style scoped>
.footer-gradient {
  background: linear-gradient(to bottom, #9EB4C8 0%, #7A97B3 100%);
}
</style>
