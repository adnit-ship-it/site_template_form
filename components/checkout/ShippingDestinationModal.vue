<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white max-w-md w-full p-6 md:p-8 rounded-xl">
      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-2xl md:text-3xl font-bold text-bodyColor font-headingFont mb-4">
          Shipping Destination
        </h2>
        <p class="text-bodyColor text-lg">
          Where would you like us to ship your medication?
        </p>
      </div>

      <!-- Options -->
      <div class="space-y-4 mb-8">
        <!-- US Shipping Option -->
        <button
          @click="selectDestination('US')"
          class="w-full p-4 border-2 rounded-xl border-bodyColor text-left transition-all duration-200 hover:border-accentColor1 hover:shadow-md"
          :class="selectedDestination === 'US' ? 'border-accentColor1 bg-accentColor1/5' : ''"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-bodyColor">United States</h3>
              <p class="text-sm text-bodyColor/70">Ship to US address</p>
            </div>
            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                 :class="selectedDestination === 'US' ? 'border-accentColor1' : 'border-bodyColor'">
              <div v-if="selectedDestination === 'US'" class="w-3 h-3 rounded-full bg-accentColor1"></div>
            </div>
          </div>
        </button>

        <!-- Mexico Shipping Option -->
        <button
          @click="selectDestination('Mexico')"
          class="w-full p-4 border-2 rounded-xl border-bodyColor text-left transition-all duration-200 hover:border-accentColor1 hover:shadow-md"
          :class="selectedDestination === 'Mexico' ? 'border-accentColor1 bg-accentColor1/5' : ''"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-bodyColor">Mexico</h3>
              <p class="text-sm text-bodyColor/70">Ship to Mexico address</p>
            </div>
            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                 :class="selectedDestination === 'Mexico' ? 'border-accentColor1' : 'border-bodyColor'">
              <div v-if="selectedDestination === 'Mexico'" class="w-3 h-3 rounded-full bg-accentColor1"></div>
            </div>
          </div>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4">
        <button
          @click="confirmSelection"
          :disabled="!selectedDestination"
          class="flex-1 bg-accentColor1 text-white py-3 px-6 rounded-full font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accentColor1/90"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean
}

interface Emits {
  (e: 'confirm', destination: 'US' | 'Mexico'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedDestination = ref<'US' | 'Mexico' | null>(null)

const selectDestination = (destination: 'US' | 'Mexico') => {
  selectedDestination.value = destination
}

const confirmSelection = () => {
  if (selectedDestination.value) {
    emit('confirm', selectedDestination.value)
  }
}

// Reset selection when modal is shown
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    selectedDestination.value = null
  }
})
</script>