<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3 w-full mb-0">
      <p class="text-white text-sm font-semibold px-4 py-2 rounded-full bg-accentColor1">Step 2</p>
      <p class="text-[22px]/[24px] font-semibold">Select Your Plan</p>
    </div>
    <p class="text-sm -translate-y-4">Lock in your savings without a big upfront payment—use free financing or pay in
      full with your card.</p>

    <!-- Main Container with Beige Background -->
    <div v-if="selectedProduct" class="space-y-4">
      <!-- Plan Options (Radio Button Style) -->
      <div class="space-y-4">
        <!-- 1 Month Option -->
        <UiFrequencyCard v-if="getVariationPrice(selectedProduct, 'monthly') && !isMonthlyHidden" title="Monthly Plan"
                         subtitle="The new you, delivered to your door monthly" supply-label="4 Week Supply"
                         :savings-text="`You are saving $${formatSavings(monthlySavings)}`"
                         :monthly-price="formatPrice(getVariationPrice(selectedProduct, 'monthly'))"
                         :original-price="formatPrice(getVariationRefillPrice(selectedProduct, 'monthly'))"
                         :limited-offer-price="formatPrice(getVariationPrice(selectedProduct, 'monthly'))"
                         :btn-color="selectedProduct.name=='Compounded Tirzepatide'?'blue':'gray'"
                         :is-selected="selectedPlan === 'monthly'" @click="selectPlanAndAdvance('monthly')"/>

        <!-- 2 Month Option -->
        <UiFrequencyCard v-if="getVariationPrice(selectedProduct, 'twoMonthly')" title="2-Month Plan"
                         subtitle="Receive your 2 month supply in a single shipment" supply-label="8 Week Supply"
                         :show-installments="true" :savings-text="`You are saving $${formatSavings(twoMonthSavings)}`"
                         :monthly-price="formatPrice(twoMonthMonthlyPrice)"
                         :is-selected="selectedPlan === 'twoMonthly'"
                         :btn-color="selectedProduct.name=='Compounded Tirzepatide'?'blue':'gray'"
                         @click="selectPlanAndAdvance('twoMonthly')"/>

        <!-- 3 Month Option -->
        <UiFrequencyCard v-if="getVariationPrice(selectedProduct, 'threeMonthly')" title="3-Month Plan"
                         subtitle="Receive your 3 month supply in a single shipment" supply-label="12 Week Supply"
                         badge="Most Popular"
                         :show-installments="true" :savings-text="`You are saving $${formatSavings(threeMonthSavings)}`"
                         :monthly-price="formatPrice(threeMonthMonthlyPrice)"
                         :is-selected="selectedPlan === 'threeMonthly'"
                         :btn-color="selectedProduct.name=='Compounded Tirzepatide'?'blue':'gray'"
                         @click="selectPlanAndAdvance('threeMonthly')"/>

        <!-- 4 Month Option -->
        <UiFrequencyCard v-if="getVariationPrice(selectedProduct, 'fourMonthly')" title="4-Month Plan"
                         subtitle="Receive your 4 month supply in a single shipment" supply-label="16 Week Supply"
                         badge="Best Value" :show-installments="true"
                         :savings-text="`You are saving $${formatSavings(fourMonthSavings)}`"
                         :monthly-price="formatPrice(fourMonthMonthlyPrice)"
                         :is-selected="selectedPlan === 'fourMonthly'"
                         :btn-color="selectedProduct.name=='Compounded Tirzepatide'?'blue':'gray'"
                         @click="selectPlanAndAdvance('fourMonthly')"/>

        <!-- 6 Month Option -->
        <UiFrequencyCard v-if="getVariationPrice(selectedProduct, 'sixMonthly')" title="6-Month Plan"
                         subtitle="Your ultimate plan to guaranteed success and your consistency"
                         supply-label="24 Week Supply"
                         badge="Best Value" :show-installments="true"
                         :savings-text="`You are saving $${formatSavings(sixMonthSavings)}`"
                         :monthly-price="formatPrice(sixMonthMonthlyPrice)" :is-selected="selectedPlan === 'sixMonthly'"
                         :btn-color="selectedProduct.name=='Compounded Tirzepatide'?'blue':'gray'"
                         @click="selectPlanAndAdvance('sixMonthly')"/>

        <!-- 12 Month (Yearly) Option -->
        <UiFrequencyCard v-if="getVariationPrice(selectedProduct, 'yearly')" title="12-Month Plan"
                         subtitle="Commit to a year of progress and save on your new self" supply-label="48 Week Supply"
                         :show-installments="true" :savings-text="`You are saving $${formatSavings(yearlySavings)}`"
                         :monthly-price="formatPrice(yearlyMonthlyPrice)" :is-selected="selectedPlan === 'yearly'"
                         :btn-color="selectedProduct.name=='Compounded Tirzepatide'?'blue':'gray'"
                         @click="selectPlanAndAdvance('yearly')"/>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {Category, Product, PlanType} from '~/types/checkout'
import {getVariationPrice, getVariationRefillPrice, hasVariation} from '~/types/checkout'
import {computed, ref, watch, onMounted, nextTick} from 'vue'

interface Props {
  selectedProduct: Product | null
  selectedCategory: Category | null
  bundlePrice: number
  isSubmitting: boolean
}

interface Emits {
  (e: 'update-bundle-price', price: number): void

  (e: 'update-bundle-medications', medications: { glp: string, nad: string }): void

  (e: 'update-plan', plan: PlanType): void

  (e: 'advance-to-payment'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Check if monthly option should be hidden (checked once on mount)
const isMonthlyHidden = ref(false)

// Check localStorage on mount
onMounted(() => {
  if (typeof window !== 'undefined') {
    isMonthlyHidden.value = localStorage.getItem('hideMonthly') === 'true'
  }
})

// Get default plan based on available options
const getDefaultPlan = (): PlanType => {
  // Check if monthly is hidden
  const hideMonthly = typeof window !== 'undefined' && localStorage.getItem('hideMonthly') === 'true'

  if (props.selectedProduct && getVariationPrice(props.selectedProduct, 'threeMonthly')) {
    return 'threeMonthly'
  } else if (props.selectedProduct && getVariationPrice(props.selectedProduct, 'twoMonthly')) {
    return 'twoMonthly'
  } else if (props.selectedProduct && getVariationPrice(props.selectedProduct, 'fourMonthly')) {
    return 'fourMonthly'
  } else if (props.selectedProduct && getVariationPrice(props.selectedProduct, 'sixMonthly')) {
    return 'sixMonthly'
  } else if (props.selectedProduct && getVariationPrice(props.selectedProduct, 'yearly')) {
    return 'yearly'
  } else if (props.selectedProduct && getVariationPrice(props.selectedProduct, 'monthly') && !hideMonthly) {
    return 'monthly'
  }
  return 'monthly' // Fallback
}

// State for selected plan - initialize with default based on available options
const selectedPlan = ref<PlanType>(getDefaultPlan())

// Total calculations
const monthlyTotal = computed(() => {
  if (!props.selectedProduct) return 407.99
  const basePrice = getVariationPrice(props.selectedProduct, 'monthly') || 0
  return basePrice + 99 + 9.99 // price + consultation + shipping
})

const twoMonthTotal = computed(() => {
  if (!props.selectedProduct) return 0
  return getVariationPrice(props.selectedProduct, 'twoMonthly') || 0
})

const threeMonthTotal = computed(() => {
  if (!props.selectedProduct) return 599
  return getVariationPrice(props.selectedProduct, 'threeMonthly') || 0
})

const fourMonthTotal = computed(() => {
  if (!props.selectedProduct) return 0
  return getVariationPrice(props.selectedProduct, 'fourMonthly') || 0
})

const sixMonthTotal = computed(() => {
  if (!props.selectedProduct) return 999
  return getVariationPrice(props.selectedProduct, 'sixMonthly') || 0
})

const yearlyTotal = computed(() => {
  if (!props.selectedProduct) return 2099
  return getVariationPrice(props.selectedProduct, 'yearly') || 0
})

// Calculate monthly price for multi-month plans
const twoMonthMonthlyPrice = computed(() => {
  const price = props.selectedProduct ? getVariationPrice(props.selectedProduct, 'twoMonthly') : undefined
  if (!price) return 0
  return Math.floor(price / 2)
})

const threeMonthMonthlyPrice = computed(() => {
  const price = props.selectedProduct ? getVariationPrice(props.selectedProduct, 'threeMonthly') : undefined
  if (!price) return 0
  return Math.floor(price / 3)
})

const fourMonthMonthlyPrice = computed(() => {
  const price = props.selectedProduct ? getVariationPrice(props.selectedProduct, 'fourMonthly') : undefined
  if (!price) return 0
  return Math.floor(price / 4)
})

const sixMonthMonthlyPrice = computed(() => {
  const price = props.selectedProduct ? getVariationPrice(props.selectedProduct, 'sixMonthly') : undefined
  if (!price) return 0
  return Math.floor(price / 6)
})

const yearlyMonthlyPrice = computed(() => {
  const price = props.selectedProduct ? getVariationPrice(props.selectedProduct, 'yearly') : undefined
  if (!price) return 0
  return Math.floor(price / 12)
})

// Calculate savings dynamically
const monthlySavings = computed(() => {
  // Old price - current price
  const monthlyPrice = props.selectedProduct ? getVariationPrice(props.selectedProduct, 'monthly') : undefined
  const monthlyRefill = props.selectedProduct ? getVariationRefillPrice(props.selectedProduct, 'monthly') : undefined
  if (!monthlyPrice || !monthlyRefill) return 0
  return monthlyRefill - monthlyPrice
})

const twoMonthSavings = computed(() => {
  if (!props.selectedProduct || !getVariationPrice(props.selectedProduct, 'monthly')) return 0
  const savings = (monthlyTotal.value * 2) - twoMonthTotal.value
  return Math.max(0, Math.round(savings))
})

const threeMonthSavings = computed(() => {
  if (!props.selectedProduct || !getVariationPrice(props.selectedProduct, 'monthly')) return 0
  const monthlyCost = monthlyTotal.value
  const threeMonthCost = threeMonthTotal.value
  const savings = (monthlyCost * 3) - threeMonthCost
  return Math.max(0, Math.round(savings))
})

const fourMonthSavings = computed(() => {
  if (!props.selectedProduct || !getVariationPrice(props.selectedProduct, 'monthly')) return 0
  const savings = (monthlyTotal.value * 4) - fourMonthTotal.value
  return Math.max(0, Math.round(savings))
})

const sixMonthSavings = computed(() => {
  if (!props.selectedProduct || !getVariationPrice(props.selectedProduct, 'monthly')) return 0
  const monthlyCost = monthlyTotal.value
  const sixMonthCost = sixMonthTotal.value
  const savings = (monthlyCost * 6) - sixMonthCost
  return Math.max(0, Math.round(savings))
})

const yearlySavings = computed(() => {
  if (!props.selectedProduct || !getVariationPrice(props.selectedProduct, 'monthly')) return 0
  const monthlyCost = monthlyTotal.value
  const yearlyCost = yearlyTotal.value
  const savings = (monthlyCost * 12) - yearlyCost
  return Math.max(0, Math.round(savings))
})

// Format price without decimals for savings
const formatSavings = (price: number | undefined | null) => {
  if (!price) return '0'
  return Math.round(price).toLocaleString('en-US')
}

// Calculate selected price based on plan
const selectedPrice = computed(() => {
  if (!props.selectedProduct) return 0

  const plan = selectedPlan.value
  if (plan === 'twoMonthly' && getVariationPrice(props.selectedProduct, 'twoMonthly')) {
    return getVariationPrice(props.selectedProduct, 'twoMonthly')!
  } else if (plan === 'threeMonthly' && getVariationPrice(props.selectedProduct, 'threeMonthly')) {
    return getVariationPrice(props.selectedProduct, 'threeMonthly')!
  } else if (plan === 'fourMonthly' && getVariationPrice(props.selectedProduct, 'fourMonthly')) {
    return getVariationPrice(props.selectedProduct, 'fourMonthly')!
  } else if (plan === 'sixMonthly' && getVariationPrice(props.selectedProduct, 'sixMonthly')) {
    return getVariationPrice(props.selectedProduct, 'sixMonthly')!
  } else if (plan === 'yearly' && getVariationPrice(props.selectedProduct, 'yearly')) {
    return getVariationPrice(props.selectedProduct, 'yearly')!
  }

  return monthlyTotal.value
})

// Watch for product changes and set default plan
watch(() => props.selectedProduct, (newProduct) => {
  if (newProduct) {
    const hideMonthly = typeof window !== 'undefined' && localStorage.getItem('hideMonthly') === 'true'

    if (getVariationPrice(newProduct, 'threeMonthly')) {
      selectedPlan.value = 'threeMonthly'
    } else if (getVariationPrice(newProduct, 'twoMonthly')) {
      selectedPlan.value = 'twoMonthly'
    } else if (getVariationPrice(newProduct, 'fourMonthly')) {
      selectedPlan.value = 'fourMonthly'
    } else if (getVariationPrice(newProduct, 'sixMonthly')) {
      selectedPlan.value = 'sixMonthly'
    } else if (getVariationPrice(newProduct, 'yearly')) {
      selectedPlan.value = 'yearly'
    } else if (getVariationPrice(newProduct, 'monthly') && !hideMonthly) {
      selectedPlan.value = 'monthly'
    } else {
      selectedPlan.value = 'monthly' // Fallback
    }
  }
}, {immediate: true})

// Watch selected plan and emit updates
watch(selectedPlan, (newPlan) => {
  emit('update-plan', newPlan)
  emit('update-bundle-price', selectedPrice.value)
}, {immediate: true})

// Helper functions
const formatPrice = (price: number | undefined | null) => {
  if (!price) return '0'
  return Math.round(price).toLocaleString('en-US')
}

const setPlan = (plan: PlanType) => {
  if (!props.selectedProduct) return

  // Check if plan is available
  if (plan === 'twoMonthly' && !getVariationPrice(props.selectedProduct, 'twoMonthly')) return
  if (plan === 'threeMonthly' && !getVariationPrice(props.selectedProduct, 'threeMonthly')) return
  if (plan === 'fourMonthly' && !getVariationPrice(props.selectedProduct, 'fourMonthly')) return
  if (plan === 'sixMonthly' && !getVariationPrice(props.selectedProduct, 'sixMonthly')) return
  if (plan === 'yearly' && !getVariationPrice(props.selectedProduct, 'yearly')) return

  selectedPlan.value = plan
}

// Select plan and immediately advance to payment step
const selectPlanAndAdvance = (plan: PlanType) => {
  setPlan(plan)

  // Customer.io: Track bundle selection
  const customerio = useCustomerio()
  const bundlePrice = plan === 'monthly' ? props.bundlePrice :
      plan === 'twoMonthly' ? twoMonthTotal.value :
          plan === 'threeMonthly' ? threeMonthTotal.value :
              plan === 'fourMonthly' ? fourMonthTotal.value :
                  plan === 'sixMonthly' ? sixMonthTotal.value :
                      yearlyTotal.value


  customerio.selectedBundle(plan, bundlePrice)

  // Use nextTick to ensure the plan is set before advancing
  nextTick(() => {
    emit('advance-to-payment')
  })
}
</script>
