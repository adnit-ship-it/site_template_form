<template>
  <div class="space-y-4">
    <!-- Full Name -->
    <div>
      <label class="block text-base font-medium text-bodyColor mb-2">
        Full Name <span class="text-red-500">*</span>
      </label>
      <input 
        v-model="addressData.fullName"
        class="form-input"
        placeholder="Juan Pérez López"
        required
      />
    </div>

    <!-- Street Address -->
    <div>
      <label class="block text-base font-medium text-bodyColor mb-2">
        Street Address <span class="text-red-500">*</span>
      </label>
      <input 
        v-model="addressData.streetAddress"
        class="form-input"
        placeholder="Calle Morelos #123-A, Int. 4"
        required
      />
    </div>

    <!-- Neighborhood -->
    <div>
      <label class="block text-base font-medium text-bodyColor mb-2">
        Neighborhood (Colonia) <span class="text-red-500">*</span>
      </label>
      <input 
        v-model="addressData.neighborhood"
        class="form-input"
        placeholder="Col. Roma Norte, Del. Cuauhtémoc"
        required
      />
    </div>

    <!-- City and State -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-base font-medium text-bodyColor mb-2">
          City <span class="text-red-500">*</span>
        </label>
        <input 
          v-model="addressData.city"
          class="form-input"
          placeholder="Ciudad de México"
          required
        />
      </div>
      <div>
        <label class="block text-base font-medium text-bodyColor mb-2">
          State <span class="text-red-500">*</span>
        </label>
      <input 
        v-model="addressData.state"
        class="form-input"
        placeholder="CDMX"
        @keydown="(event: KeyboardEvent) => { 
          const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
          if (!allowedKeys.includes(event.key) && !/[a-zA-Z]/.test(event.key)) {
            event.preventDefault();
          }
        }"
        @input="(event: Event) => { const target = event.target as HTMLInputElement; addressData.state = target.value.toUpperCase(); }"
        required
      />
      </div>
    </div>

    <!-- Postal Code -->
    <div>
      <label class="block text-base font-medium text-bodyColor mb-2">
        Postal Code (Código Postal) <span class="text-red-500">*</span>
      </label>
      <input 
        v-model="addressData.postalCode"
        type="text"
        pattern="[0-9]*"
        inputmode="numeric"
        class="form-input"
        placeholder="06100"
        @keydown="(event: KeyboardEvent) => { 
          const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
          if (!allowedKeys.includes(event.key) && !/[0-9]/.test(event.key)) {
            event.preventDefault();
          }
        }"
        required
      />
    </div>

    <!-- Country -->
    <div>
      <label class="block text-base font-medium text-bodyColor mb-2">
        Country
      </label>
      <input 
        v-model="addressData.country"
        class="form-input"
        readonly
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';

interface MexicoAddress {
  fullName: string;
  streetAddress: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// --- PROPS & EMITS ---
const props = defineProps<{
  modelValue?: any;
  formAnswers?: any;
}>();

const emit = defineEmits(['update:modelValue']);

// --- REACTIVE STATE ---
const addressData = reactive<MexicoAddress>({
  fullName: '',
  streetAddress: '',
  neighborhood: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'MÉXICO'
});

// Track if fullName has been manually edited
const fullNameManuallyEdited = ref(false);

// --- COMPUTED ---
const getFullName = () => {
  const firstName = props.formAnswers?.firstName || ''
  const lastName = props.formAnswers?.lastName || ''
  return `${firstName} ${lastName}`.trim()
}

// --- METHODS ---
const updateAddress = () => {
  // Convert to Stripe-compatible format - always emit, even with empty values
  // This mimics Stripe's behavior where it emits on every change
  const stripeAddress = {
    fullName: addressData.fullName || '',
    addressLine1: addressData.streetAddress || '',
    addressLine2: addressData.neighborhood || '',
    city: addressData.city || '',
    state: addressData.state || '',
    postalCode: addressData.postalCode || '',
    country: 'MX'
  };

  emit('update:modelValue', stripeAddress);
};

// --- WATCHERS ---
// Initialize with existing value if provided
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Only update fullName if it hasn't been manually edited
    if (!fullNameManuallyEdited.value) {
      addressData.fullName = newValue.fullName || '';
    }
    addressData.streetAddress = newValue.addressLine1 || '';
    addressData.neighborhood = newValue.addressLine2 || '';
    addressData.city = newValue.city || '';
    addressData.state = newValue.state || '';
    addressData.postalCode = newValue.postalCode || '';
    addressData.country = 'MÉXICO';
  }
}, { immediate: true });

// Initialize full name from form answers (only if not manually edited)
watch(() => props.formAnswers, () => {
  if (props.formAnswers && !fullNameManuallyEdited.value && !addressData.fullName) {
    addressData.fullName = getFullName();
  }
}, { immediate: true });

// Watch for manual changes to fullName
watch(() => addressData.fullName, (newValue, oldValue) => {
  // If the user is typing (value is changing and not empty), mark as manually edited
  if (newValue !== oldValue && newValue.trim() !== '') {
    fullNameManuallyEdited.value = true;
  }
});

// Watch for changes in address data and update the parent
watch(addressData, () => {
  updateAddress();
}, { deep: true });
</script>

<style scoped>
.form-input {
  @apply block w-full border-2 rounded-xl border-bodyColor bg-gray-50 px-2 md:px-4 h-10 md:h-12 text-base md:text-lg appearance-none focus:outline-none focus:border-accentColor1 transition-colors duration-200;
}
</style>