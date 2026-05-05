<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="closeModal">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
          <!-- Close button -->
          <button @click="closeModal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h2 class="text-2xl font-bold text-center text-bodyColor mb-3">
            Your payment could not be completed
          </h2>

          <!-- Message -->
          <p class="text-center text-bodyColor mb-6">
            Oh no! It looks like your payment was declined, but don't worry.  You can still complete your order using Buy Now, Pay Later. <br><br>
            Most customers choose this option to split their payment into <b class="underline decoration-blue-400">smaller, interest-free installments.</b>
          </p>

          <!-- Button -->
          <button @click="switchToBNPL"
            class="w-full bg-[#1612d3] text-white py-3 px-6 rounded-full font-semibold text-base hover:bg-[#1612d3]/90 transition-colors">
            Continue with Buy Now, Pay Later
          </button>

          <!-- Cancel link -->
          <button @click="closeModal" class="w-full mt-3 text-gray-500 text-sm hover:text-gray-700 transition-colors">
            Use a different card
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(false)

const emit = defineEmits(['switch-to-bnpl', 'close'])

const showModal = () => {
  isVisible.value = true
}

const closeModal = () => {
  isVisible.value = false
  emit('close')
}

const switchToBNPL = () => {
  emit('switch-to-bnpl')
  closeModal()
}

// Expose method to parent
defineExpose({
  showModal,
  closeModal
})
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
