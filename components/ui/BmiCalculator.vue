<template>
    <div class="flex flex-col bg-backgroundColor2 p-4 pt-8 gap-1 lg:gap-3 min-w-[304px] max-w-[304px] h-[464px] rounded-xl overflow-hidden">
        <div class="relative w-full max-w-sm mx-auto h-[208px]">
            <ClientOnly>
                <template #fallback>
                    <div class="w-full h-full flex items-center justify-center">Loading Chart...</div>
                </template>
                <VueApexCharts :options="chartOptions" :series="chartSeries" type="radialBar" height="300" />
            </ClientOnly>

            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-2">
                <span class="text-[64px] font-light text-bodyColor tracking-tighter">
                    {{ bmi || '00' }}
                </span>
                <span class="block text-bodyColor uppercase tracking-wider">BMI</span>
            </div>
        </div>

        <div class="flex flex-col gap-4 mb-2 lg:mb-5">
            <div class="relative">
                <input type="number" v-model="weight" placeholder="Weight (lbs)"
                    class="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#132638] transition" />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">lbs</span>
            </div>

            <div class="flex gap-4">
                <div class="relative w-1/2">
                    <input type="number" v-model="heightFt" placeholder="Height"
                        class="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#132638] transition" />
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">ft</span>
                </div>
                <div class="relative w-1/2">
                    <input type="number" v-model="heightIn" placeholder="Height"
                        class="w-full px-4 py-3 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#132638] transition" />
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">in</span>
                </div>
            </div>
        </div>

        <button
            class="w-full bg-accentColor1 uppercase text-white py-3 rounded-full hover:bg-opacity-90 transition flex items-center justify-center gap-2">
            Start your journey
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ApexOptions } from 'apexcharts';
import VueApexCharts from 'vue3-apexcharts';

// --- State (User Inputs) ---
const weight = ref<string>('');
const heightFt = ref<string>('');
const heightIn = ref<string>('');

// --- Logic (BMI Calculation) ---
const bmi = computed(() => {
    const weightLbs = parseFloat(weight.value);
    const feet = parseFloat(heightFt.value);
    const inches = parseFloat(heightIn.value);

    // Treat NaN as 0
    const numWeight = isNaN(weightLbs) ? 0 : weightLbs;
    const numFeet = isNaN(feet) ? 0 : feet;
    const numInches = isNaN(inches) ? 0 : inches;

    if (numWeight > 0 && (numFeet > 0 || numInches > 0)) {
        const totalInches = (numFeet * 12) + numInches;
        if (totalInches > 0) {
            const bmiValue = (numWeight / (totalInches * totalInches)) * 703;
            return parseFloat(bmiValue.toFixed(1));
        }
    }
    return null;
});

// --- Chart Logic ---
const bmiPercent = computed(() => {
    if (!bmi.value) return 0;
    const minBmi = 15;
    const maxBmi = 40;
    const value = ((bmi.value - minBmi) / (maxBmi - minBmi)) * 100;
    return Math.max(0, Math.min(100, value));
});

const chartSeries = computed(() => [bmiPercent.value]);

const chartOptions: ApexOptions = {
    chart: {
        type: 'radialBar',
        offsetY: -20,
        sparkline: {
            enabled: true
        }
    },
    plotOptions: {
        radialBar: {
            startAngle: -110,
            endAngle: 110,
            hollow: {
                size: '72%',
            },
            track: {
                background: "#a3b0bc",
                strokeWidth: '100%',
                margin: 5,
            },
            dataLabels: {
                name: { show: false },
                value: { show: false },
            }
        }
    },
    grid: {
        padding: {
            top: -10
        }
    },
    stroke: {
        lineCap: 'round'
    },
    fill: {
        type: 'gradient',
        gradient: {
            shade: 'light',
            type: 'horizontal',
            shadeIntensity: 0.5,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            colorStops: [
                { offset: 0, color: '#45E86E', opacity: 1 },
                { offset: 50, color: '#FFED2B', opacity: 1 },
                { offset: 100, color: '#FF8C6C', opacity: 1 },
            ]
        },
    },
    labels: ['BMI'],
};
</script>

<style scoped>
/* Hide number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
}

input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
}
</style>