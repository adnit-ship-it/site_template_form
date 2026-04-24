<template>
  <nav
    :class="['fixed border-b border-[#d9d9d9] !bg-white left-0 right-0 z-50', background, alt ? 'border-b border-[#d9d9d9]' : '']"
    :style="{ top: 'var(--site-announcement-height, 0px)' }"
  >
    <!-- Countdown Timer Banner (replaces marketing banner on checkout) -->
    <div v-if="!hideTopBar && showCountdown" :class="['w-full h-[52px] px-4 flex items-center justify-center bg-[#FDE9AB]']">
      <p :class="['text-sm text-center font-medium', alt ? 'text-white' : '']">
        Your Discount Expires in
        <span :class="['font-bold', alt ? 'text-accentColor1' : 'text-accentColor2']">{{ formattedTime }}</span>
      </p>
    </div>

    <!-- Marketing Banner (shown when not showing countdown) -->
    <NuxtLink v-else-if="!hideTopBar && showMarketing" to="/" :class="['w-full h-[44px] lg:h-[52px] flex items-center justify-center bg-[#E4ECF7] cursor-pointer hover:bg-[#E4ECF7]/90 transition-colors overflow-hidden']">
      <!-- Desktop: Static text in one line -->
      <p :class="['hidden lg:block text-sm whitespace-nowrap', alt ? 'text-white' : '']">
        First-Time Customer Promo: <span :class="['font-bold text-accentColor1']">Unlock $140 OFF + FREE shipping.</span>
      </p>
      <!-- Mobile: Marquee text -->
      <div class="block lg:hidden w-full">
        <NuxtMarquee :duration="40" :pause-on-hover="false">
          <p :class="['text-sm whitespace-nowrap mx-8', alt ? 'text-white' : '']">
            Unlock a First-Time Customer Promo! <span :class="['font-bold text-accentColor1']">Click here to get $140 off + free shipping!</span>
          </p>
        </NuxtMarquee>
      </div>
    </NuxtLink>
    <div :class="[
      'w-full flex items-center  py-1.5 px-4 max-w-[1304px] mx-auto',
      (centerLogo || hidebtn || logoOnly) ? 'justify-center' : 'justify-between',
    ]">
      <div class="flex items-center gap-2 lg:gap-3">
        <NuxtLink to="/">
          <img src="/assets/images/brand/logo.png" alt="Brand Logo" class="h-[32px] lg:h-[92px] w-auto" />
        </NuxtLink>
        <img v-if="showTrustpilot" src="/assets/images/icons/trustpilot-exc.png" alt="Trustpilot Excellent 4.7" class="h-[16px] lg:h-[20px] w-auto" />
      </div>
      <!-- Original "Over X lbs lost" (for non-checkout pages) -->
      <!-- <div v-if="!logoOnly && !alt && !showCountdown" class="hidden lg:flex gap-2">
        <p>Over</p>
        <div class="flex gap-1 items-center">
          <template v-for="(digit, index) in digits" :key="index">
            <p v-if="index === 3" class="text-black">,</p>
            <div class="bg-white rounded h-[24px] w-[16px] overflow-hidden">
              <div class="digit-reel" :style="digitStyles[index]">
                <template v-for="set in 10" :key="set">
                  <div v-for="n in 10" :key="n"
                    class="h-[24px] bg-backgroundColor2 w-[16px] flex justify-center items-center">
                    <p class="text-accentColor1">{{ n - 1 }}</p>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
        <p>lbs lost</p>
      </div> -->
      <div v-if="!logoOnly" class="flex items-center gap-4">
        <UiButton :class="'!font-bold text-nowrap text-xs min-[380px]:text-[13px]'" v-if="showMarketing && !hidebtn" to="/" color="accentColor2" label="take the quiz" :showArrow="true" arrowColor="#000000"
          class="px-4 py-2 w-[144px] min-[380px]:w-[160px] lg:w-[204px] !text-black font-bold" />
        <!-- <UiButton to="https://care.altrx.com/login" color="accentColor1" label="Log in" showAnimation :showArrow="false" :targetType="'_blank'"
                  link-class="!w-24 lg:w-[204px] relative z-20 hidden md:block" class="font-semibold relative w-full !text-[15px] h-[40px]" /> -->
        <button @click="toggleMobileMenu" class="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Toggle menu">
          <img src="/assets/images/hamburger-menu.svg" alt="Menu" class="w-6 h-6" />
        </button>
      </div>
    </div>
    <!-- Dropdown Menu -->
    <div v-if="!logoOnly && isMobileMenuOpen"
      class="absolute top-full left-0 right-0 bg-white border-b border-[#d9d9d9] shadow-lg z-50">
      <div class="max-w-5xl mx-auto px-4 py-4">
        <NuxtLink to="/" @click="closeMobileMenu" class="block py-3 px-4 hover:bg-gray-50 rounded transition-colors">
          Home
        </NuxtLink>
        <NuxtLink to="/welcome" @click="closeMobileMenu" class="block py-3 px-4 hover:bg-gray-50 rounded transition-colors">
          Welcome
        </NuxtLink>
        <!-- <NuxtLink to="https://care.altrx.com/login" @click="closeMobileMenu" target="_blank"
                  class="block py-3 px-4 hover:bg-gray-50 rounded transition-colors">
          Log In
        </NuxtLink> -->
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";

// Define the color prop with a default value of 'bg-white'
const props = defineProps({
  color: {
    type: String,
    default: "bg-white",
  },
  hideNavigation: {
    type: Boolean,
    default: false,
  },
  showMarketing: {
    type: Boolean,
    default: true,
  },
  centerLogo: {
    type: Boolean,
    default: false,
  },
  background: {
    type: String,
    default: "bg-transparent",
  },
  alt: {
    type: Boolean,
    default: false,
  },
  hidebtn: {
    type: Boolean,
    default: false,
  },
  showCountdown: {
    type: Boolean,
    default: false,
  },
  logoOnly: {
    type: Boolean,
    default: false,
  },
  hideTopBar: {
    type: Boolean,
    default: false,
  },
  showTrustpilot: {
    type: Boolean,
    default: false,
  },
});

// --- START: Number Animation Logic ---
const targetNumber = ref(0);
const isAnimating = ref(false);

// A computed property to create an array of 6 digits from the number
const digits = computed(() => {
  return String(targetNumber.value).padStart(6, '0').split('');
});

// A computed property to generate the style for EACH digit
const digitStyles = computed(() => {
  return digits.value.map((digitStr, index) => {
    // --- STARTING STATE ---
    if (!isAnimating.value) {
      return {
        transform: 'translateY(0px)',
        'transition-duration': '0s'
      };
    }

    // --- ANIMATING STATE ---
    const digit = Number(digitStr);
    const digitHeight = 24; // h-[24px]
    const reelStripHeight = 10 * digitHeight; // 10 numbers (0-9)

    const baseRotations = 2;
    const extraRotations = index;
    const totalRotations = baseRotations + extraRotations;
    const duration = 2.0 + index * 0.15;

    const finalTranslateY = -((9 * reelStripHeight) + (digit * digitHeight));

    return {
      transform: `translateY(${finalTranslateY}px)`,
      'transition-duration': `${duration}s`,
    };
  });
});
// --- END: Number Animation Logic ---

// --- START: Countdown Timer Logic ---
const timeRemaining = ref(600); // 10 minutes in seconds (10:00)
const countdownInterval = ref(null);
const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  const seconds = timeRemaining.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const startCountdown = () => {
  if (typeof window === 'undefined') return;

  if (countdownInterval.value) {
    window.clearInterval(countdownInterval.value);
  }

  countdownInterval.value = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    } else {
      if (countdownInterval.value) {
        window.clearInterval(countdownInterval.value);
        countdownInterval.value = null;
      }
    }
  }, 1000);
};

const stopCountdown = () => {
  if (typeof window === 'undefined') return;

  if (countdownInterval.value) {
    window.clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
};
// --- END: Countdown Timer Logic ---

// Mobile menu state
const isMobileMenuOpen = ref(false);

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Close mobile menu
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

// Close mobile menu when clicking outside
const handleClickOutside = (event) => {
  if (isMobileMenuOpen.value && !event.target.closest("nav")) {
    closeMobileMenu();
  }
};

// Add click outside listener
onMounted(() => {
  if (typeof window === 'undefined') return;

  // Set the target number after a brief delay (only if not showing countdown)
  if (!props.showCountdown) {
    setTimeout(() => {
      targetNumber.value = 312305; // Update the number
      isAnimating.value = true;  // Trigger the animation
    }, 100);
  }

  // Start countdown if showCountdown is true
  if (props.showCountdown) {
    startCountdown();
  }

  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  stopCountdown();
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
/* --- START: Added for animation --- */
.digit-reel {
  transition-property: transform;
  transition-timing-function: cubic-bezier(.25, 1, .5, 1);
  /* ease-out-quad */
}

/* --- END: Added for animation --- */
</style>
