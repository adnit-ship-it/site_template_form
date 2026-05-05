<template>
  <div class="min-h-screen bg-gray-100 p-6 font-mono text-sm text-bodyColor">
    <div class="mx-auto max-w-4xl space-y-8">
      <header class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <h1 class="text-lg font-bold">Brand snapshot (data/common.json)</h1>
        <p class="mt-1 text-xs">
          Compares JSON → <code class="rounded bg-white/80 px-1">:root</code> CSS variables → Tailwind utility
          swatches. Only available in development.
        </p>
      </header>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Head &amp; runtime</h2>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
          <dt class="text-gray-500">document.title</dt>
          <dd class="break-all">{{ documentTitle || "—" }}</dd>
          <dt class="text-gray-500">strings.siteTitle (expected)</dt>
          <dd class="break-all">{{ common.strings?.siteTitle || "—" }}</dd>
          <dt class="text-gray-500">Title match</dt>
          <dd>
            <span :class="titleMatch ? 'text-green-700' : 'text-red-600'">{{ titleMatch ? "✓" : "✗" }}</span>
          </dd>
          <dt class="text-gray-500">runtimeConfig.public.orgName</dt>
          <dd class="break-all">{{ orgName }}</dd>
          <dt class="text-gray-500">brand.orgName (JSON)</dt>
          <dd class="break-all">{{ common.brand?.orgName || "—" }}</dd>
        </dl>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Color tokens</h2>
        <p class="mb-3 text-xs text-gray-500">
          Each row: value in JSON, value on <code>:root</code> (client), Tailwind swatch.
        </p>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="py-2 pr-2">Token</th>
                <th class="py-2 pr-2">JSON</th>
                <th class="py-2 pr-2">:root var</th>
                <th class="py-2 pr-2">Match</th>
                <th class="py-2">Tailwind</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in colorRows"
                :key="row.key"
                class="border-b border-gray-100"
              >
                <td class="py-2 pr-2 font-medium">{{ row.key }}</td>
                <td class="py-2 pr-2 break-all">{{ row.json }}</td>
                <td class="py-2 pr-2 break-all text-gray-600">{{ row.cssVar || "—" }}</td>
                <td class="py-2 pr-2">
                  <span v-if="row.cssVar" :class="row.match ? 'text-green-700' : 'text-red-600'">
                    {{ row.match ? "✓" : "✗" }}
                  </span>
                  <span v-else class="text-gray-400">(SSR)</span>
                </td>
                <td class="py-2">
                  <div
                    class="h-8 w-16 max-w-full rounded border border-gray-200"
                    :class="row.tailwindClass"
                    :title="row.tailwindClass"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Font stacks (JSON → CSS var)</h2>
        <ul class="space-y-2 text-xs">
          <li v-for="f in fontRows" :key="f.key">
            <span class="font-medium text-gray-700">{{ f.key }}:</span>
            <span class="ml-1 text-gray-600">{{ f.json }}</span>
          </li>
        </ul>
        <p class="mt-3 text-xs text-gray-500">
          Sample: <span class="font-headingFont text-base text-accentColor1">headingFont</span>
          <span class="mx-2">|</span>
          <span class="font-bodyFont">bodyFont paragraph text</span>
        </p>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Announcement (JSON)</h2>
        <pre class="overflow-x-auto rounded bg-gray-50 p-3 text-xs">{{ JSON.stringify(common.announcement, null, 2) }}</pre>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommon } from "~/composables/useCommon";

if (import.meta.env.PROD) {
  throw createError({ statusCode: 404, statusMessage: "Not found" });
}

definePageMeta({ layout: false });

const common = useCommon();
const config = useRuntimeConfig();

const orgName = computed(() => String(config.public.orgName ?? ""));

const documentTitle = ref("");
const cssVarValues = ref<Record<string, string>>({});

const colorKeys = [
  "backgroundColor",
  "bodyColor",
  "accentColor1",
  "accentColor2",
  "backgroundColor2",
] as const;

const twClass: Record<string, string> = {
  backgroundColor: "bg-backgroundColor",
  bodyColor: "bg-bodyColor",
  accentColor1: "bg-accentColor1",
  accentColor2: "bg-accentColor2",
  backgroundColor2: "bg-backgroundColor2",
};

const colorRows = computed(() => {
  const jsonColors = common.brand?.colors ?? {};
  return colorKeys.map((key) => {
    const json = jsonColors[key] ?? "";
    const fromDom = cssVarValues.value[key]?.trim() || "";
    const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();
    const match = fromDom && json && norm(fromDom) === norm(json);
    return {
      key,
      json,
      cssVar: fromDom || undefined,
      match,
      tailwindClass: twClass[key] ?? "",
    };
  });
});

const fontRows = computed(() => {
  const stacks = common.brand?.fontStacks ?? {};
  return Object.entries(stacks).map(([key, arr]) => ({
    key,
    json: Array.isArray(arr) ? arr.join(", ") : String(arr),
  }));
});

const titleMatch = computed(() => {
  const expected = common.strings?.siteTitle?.trim() ?? "";
  const actual = documentTitle.value?.trim() ?? "";
  return expected && actual && expected === actual;
});

onMounted(() => {
  documentTitle.value = document.title;
  const root = document.documentElement;
  for (const key of colorKeys) {
    const v = getComputedStyle(root).getPropertyValue(`--${key}`).trim();
    cssVarValues.value = { ...cssVarValues.value, [key]: v || "" };
  }
});
// Intentionally no page title: inherits app head from nuxt.config (driven by common.json strings.siteTitle) for the title check.
</script>
