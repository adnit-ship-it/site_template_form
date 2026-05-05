<template>
  <div class="flex items-center bg-backgroundColor justify-center min-h-[calc(100vh-200px)] px-6">
    <div class="max-w-[666px] w-full space-y-4">
      <div id="payment-success" class="bg-white rounded-[16px] shadow-lg px-10 py-12 lg:py-16 text-center border border-black/10">
        <div class="mb-6">
          <div class="w-16 h-16 bg-accentColor1/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-accentColor1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-accentColor1 text-[40px] mb-2 font-headingAlt">Congratulations!</h1>
          <p class="text-black font-semibold">Your payment has been successfully processed.</p>
        </div>

        <p>
          Thank you for completing your medical intake form. We'll be in touch soon with next steps.
        </p>
       
        <!-- <p v-else class="text-sm text-gray-700">
          Since you live in a state that requires a Video Call visit before you can be prescribed, please click this link to book a free appointment:
        </p> -->
      </div>

      <!-- Calendly Link for Sync States -->
      <!-- <div v-if="showSync" class="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
        <a 
          href="https://calendly.com/altrx"
          target="_blank"
          rel="noopener noreferrer"
          class="text-accentColor1 hover:text-accentColor1/80 underline font-medium text-sm md:text-base"
        >
          https://calendly.com/altrx
        </a>
      </div> -->

      <button @click="goHome"
        class="w-full bg-accentColor1 text-white py-3 px-4 rounded-full transition-colors">
        Back Home
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { pushDataLayer } from '~/utils/dataLayer'

definePageMeta({
  layout: 'checkout'
})

const route = useRoute()

// Check if showSync query parameter is true
const showSync = computed(() => route.query.showSync === 'true')

const config = useRuntimeConfig()

const goHome = () => {
  window.location.href = config.public.homeUrl as string
}

// Best-effort retrieval of the user's submitted form answers. Both the quiz
// persistence layer (`quiz_<id>_data`) and the BNPL checkout snapshot
// (`checkout_step1_data`) may be available; we read whichever survives.
const readSubmittedFormAnswers = (): Record<string, unknown> => {
  if (typeof window === 'undefined') return {}

  try {
    const step1 = localStorage.getItem('checkout_step1_data')
    if (step1) {
      const parsed = JSON.parse(step1)
      if (parsed?.formAnswers && typeof parsed.formAnswers === 'object') {
        return parsed.formAnswers as Record<string, unknown>
      }
    }
  } catch {
    // fall through to quiz data
  }

  const categoryId = (route.query.categoryId as string) || ''
  const candidateKeys: string[] = []
  if (categoryId) candidateKeys.push(`quiz_${categoryId}_data`)

  // Fallback: scan for any quiz_*_data entry
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('quiz_') && key.endsWith('_data') && !candidateKeys.includes(key)) {
      candidateKeys.push(key)
    }
  }

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      // `useFormPersistence` stores form answers at the root of this object
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
    } catch {
      // continue scanning
    }
  }

  return {}
}

// Resolve the medical consent value. Different quizzes store it under
// different keys; fall back to an explicit `consentMedical` key if present.
const resolveConsentMedical = (answers: Record<string, unknown>): unknown => {
  const candidates = [
    'consentMedical',
    'hrtTelemedicineConsent',
    'hrtPCPConsent',
    'womensHRTPCPConsent',
    'medicalConsent',
  ]
  for (const key of candidates) {
    const value = answers[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

// Resolve the payment-authorization consent (the checkout consent checkbox)
const resolveConsentPaymentAuth = (answers: Record<string, unknown>): unknown => {
  const candidates = ['consentPaymentAuth', 'consent', 'paymentAuthConsent']
  for (const key of candidates) {
    const value = answers[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

onMounted(() => {
  const answers = readSubmittedFormAnswers()
  pushDataLayer({
    event: 'PAYMENT_SUCCESS',
    consentMedical: resolveConsentMedical(answers),
    consentPaymentAuth: resolveConsentPaymentAuth(answers),
  })
})
</script>
