<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isPopupVisible" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
        @click.self="closePopup">
        <div class="relative w-full max-w-[676px] overflow-hidden h-full max-h-[504px]" @click.stop>
          <!-- Background Image -->
          <NuxtImg src="/assets/images/misc/popup-bg.png" alt="Background"
            class="absolute inset-0 w-full h-full object-cover" />
          <!-- Content -->
          <div class="relative z-10 px-5 py-9 w-full h-full bg-black/35 flex justify-center lg:justify-start">
            <!-- Success Message Box -->
            <div v-if="showSuccessMessage" 
              class="bg-[#FDE9AB] text-[#C17A0F] px-8 py-6 rounded-[9px] h-fit font-medium text-xl text-center">
              Submission received
            </div>

            <!-- Form Content -->
            <div v-else class="flex flex-col items-center max-w-[298px]">
              <!-- Logo -->
              <img src="/assets/images/brand/logo-alt.svg" alt="altRx Logo" class="w-[72px] mb-5">

              <!-- Main Heading -->
              <div class="flex flex-col gap-0">
                <h1 class="text-center text-[#daeaff] text-[60px]/[50px] font-headingFont">Enjoy <br /><span
                    class="font-headingAlt text-[60px]/[50px]">$140 Off</span></h1>
                <p class="text-lg text-white text-center font-light mb-2">on your first order</p>
                <p class="text-[#FBCE45] text-sm text-center font-black mb-5 uppercase tracking-wide">
                  GET YOUR FIRST MONTH AS LOW AS $159
                </p>
              </div>

              <!-- Email Form -->
              <form @submit.prevent="handleSubmit" class="w-full max-w-md space-y-2 mb-5">
                <input v-model="email" type="email" placeholder="Email Address" required
                  class="w-full px-4 rounded-[9px] bg-white text-gray-800 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#F4C430] h-[42px]" />

                <button type="submit" :disabled="isSubmitting"
                  class="w-full px-6 h-[52px] rounded-[9px] bg-[#FDE9AB] text-[#C17A0F] font-bold text-base uppercase tracking-wide hover:bg-[#E5B520] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ isSubmitting ? 'PLEASE WAIT...' : 'UNLOCK MY $140 DISCOUNT' }}
                </button>
              </form>

              <!-- Trust Badges -->
              <div class="flex items-center gap-3 lg:gap-4 mt-auto">
                <NuxtImg src="/assets/images/icons/hipaa.png" alt="HIPAA Compliant"
                  class="h-12 lg:h-16 w-auto object-contain" />
                <a href="https://www.legitscript.com/websites/?checker_keywords=altrx.com" target="_blank"
                  title="Verify LegitScript Approval for www.altrx.com">
                  <img src="https://static.legitscript.com/seals/48475686.png" alt="Verify Approval for www.altrx.com"
                    width="54" height="60" />
                </a>
                <NuxtImg src="/assets/images/icons/made-usa.jpg" alt="Made in USA"
                  class="h-12 lg:h-16 w-auto object-contain rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { isPopupVisible, closePopup } = useInactivityTimer();
const customerio = useCustomerio();

const email = ref('');
const isSubmitting = ref(false);
const showSuccessMessage = ref(false);

const handleSubmit = async () => {
  if (!email.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    // Customer.io: Identify user as popup lead
    customerio.identify(email.value, {
      email: email.value,
      popup_lead: true
    });

    // Show success message
    showSuccessMessage.value = true;

    // Close popup after 2 seconds
    setTimeout(async () => {
      await navigateTo({
        path: '/',
      })
      closePopup();
      // Reset states after closing
      setTimeout(() => {
        showSuccessMessage.value = false;
        email.value = '';
      }, 300); // Wait for fade animation to complete
    }, 2000);
  } catch (error) {
    console.error('Error submitting email:', error);
    // Show success message anyway for better UX
    showSuccessMessage.value = true;
    setTimeout(async () => {
      await navigateTo({
        path: '/',
      })
      closePopup();
      setTimeout(() => {
        showSuccessMessage.value = false;
        email.value = '';
      }, 300);
    }, 2000);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
