<template>
    <div class="flex flex-col items-center">
        <!-- Trust Badges - Desktop (Static Grid) -->
        <div class="hidden lg:flex justify-center gap-12 text-base/[20px]">
            <div class="flex items-center gap-2">
                <img src="/assets/images/icons/full-star.svg" alt="star" class="w-[20px] h-[20px]">
                <p>US-Certified Pharmacy</p>
            </div>
            <div class="flex items-center gap-2">
                <img src="/assets/images/icons/doctor.svg" alt="doctor" class="w-[20px] h-[20px]">
                <p>Personalized Treatment</p>
            </div>
            <div class="flex items-center gap-2">
                <img src="/assets/images/icons/ribbon.svg" alt="ribbon" class="w-[20px] h-[20px]">
                <p>Trusted by 100k+ Americans</p>
            </div>
            <div class="flex items-center gap-2">
                <img src="/assets/images/icons/clipboard.svg" alt="clipboard" class="w-[20px] h-[20px]">
                <p>1:1 Medical Support</p>
            </div>
        </div>

        <!-- Trust Badges - Mobile (Auto-sliding) -->
        <div class="lg:hidden w-full">
            <ClientOnly>
                <Swiper
                    :modules="[SwiperAutoplay]"
                    :slides-per-view="1"
                    :space-between="0"
                    :autoplay="{ delay: 3000, disableOnInteraction: false }"
                    :loop="true"
                    class="h-[40px]"
                >
                    <SwiperSlide>
                        <div class="flex items-center justify-center gap-2 text-base/[20px]">
                            <img src="/assets/images/icons/full-star.svg" alt="star" class="w-[20px] h-[20px]">
                            <p>US-Certified Pharmacy</p>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div class="flex items-center justify-center gap-2 text-base/[20px]">
                            <img src="/assets/images/icons/doctor.svg" alt="doctor" class="w-[20px] h-[20px]">
                            <p>Personalized Treatment</p>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div class="flex items-center justify-center gap-2 text-base/[20px]">
                            <img src="/assets/images/icons/ribbon.svg" alt="ribbon" class="w-[20px] h-[20px]">
                            <p>Trusted by 100k+ Americans</p>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div class="flex items-center justify-center gap-2 text-base/[20px]">
                            <img src="/assets/images/icons/clipboard.svg" alt="clipboard" class="w-[20px] h-[20px]">
                            <p>1:1 Medical Support</p>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </ClientOnly>
        </div>

        <!-- CTA Buttons -->
        <div class="mt-8 lg:mt-20 flex justify-center gap-4">
            <button @click="navigateTo('/')" class="bg-accentColor1 text-white font-semibold h-[52px] w-[177px] rounded-full">
                Get started
            </button>
            <button @click="navigateTo('/')" class="bg-white text-[#1F2937] font-semibold h-[52px] w-[177px] rounded-full border border-[#d1d5db]">
                See pricing
            </button>
        </div>

        <!-- Features -->
        <div class="mt-4 flex flex-col lg:flex-row gap-2 items-center lg:gap-4 justify-center">
            <div class="flex items-center gap-1">
                <img src="/assets/images/icons/no.svg" alt="no" class="w-[14px] h-[14px]">
                <p>No Hidden fees</p>
            </div>
            <div class="flex items-center gap-1">
                <img src="/assets/images/icons/no.svg" alt="no" class="w-[14px] h-[14px]">
                <p>No Monthly Membership</p>
            </div>
            <div class="flex items-center gap-1">
                <img src="/assets/images/icons/yes.svg" alt="yes" class="w-[14px] h-[14px]">
                <p>Cancel Anytime</p>
            </div>
        </div>

        <!-- Trustpilot Rating -->
        <div class="flex flex-col lg:flex-row items-center gap-2 mt-4 justify-center">
            <div class="flex items-center gap-2">
                <p class="text-sm font-semibold">4.4/5</p>
                <div class="flex gap-0.5">
                    <img src="/assets/images/misc/trustpilot-star.png" alt="Trustpilot" class="w-4 h-4 object-contain">
                    <img src="/assets/images/misc/trustpilot-star.png" alt="Trustpilot" class="w-4 h-4 object-contain">
                    <img src="/assets/images/misc/trustpilot-star.png" alt="Trustpilot" class="w-4 h-4 object-contain">
                    <img src="/assets/images/misc/trustpilot-star.png" alt="Trustpilot" class="w-4 h-4 object-contain">
                    <img src="/assets/images/misc/trustpilot-star-half.png" alt="Trustpilot" class="w-4 h-4 object-contain">
                </div>
            </div>
            <p class="text-sm font-medium">Based on <span class="font-semibold">thousands of happy clients</span></p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay as SwiperAutoplay } from 'swiper/modules'
import 'swiper/css'

// Reusable CTA section with trust badges, buttons, and Trustpilot rating
</script>
