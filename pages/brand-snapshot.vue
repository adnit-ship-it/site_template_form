<template>
  <div class="min-h-screen bg-gray-100 p-6 font-mono text-sm text-bodyColor">
    <div class="mx-auto max-w-4xl space-y-8">
      <header class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <h1 class="text-lg font-bold">Brand snapshot (Supabase site_branding)</h1>
        <p class="mt-1 text-xs">
          Compares runtime branding → <code class="rounded bg-white/80 px-1">:root</code> CSS variables → Tailwind
          swatches. Only available in development.
        </p>
      </header>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Head &amp; runtime</h2>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
          <dt class="text-gray-500">document.title</dt>
          <dd class="break-all">{{ documentTitle || "—" }}</dd>
          <dt class="text-gray-500">strings.siteTitle (branding)</dt>
          <dd class="break-all">{{ common.strings?.siteTitle || "—" }}</dd>
          <dt class="text-gray-500">Title match</dt>
          <dd>
            <span :class="titleMatch ? 'text-green-700' : 'text-red-600'">{{ titleMatch ? "✓" : "✗" }}</span>
          </dd>
          <dt class="text-gray-500">runtimeConfig.public.orgName</dt>
          <dd class="break-all">{{ orgName }}</dd>
          <dt class="text-gray-500">brand.orgName (branding)</dt>
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
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Font stacks (assets/fonts → CSS var)</h2>
        <ul class="space-y-2 text-xs">
          <li v-for="f in fontRows" :key="f.key">
            <span class="font-medium text-gray-700">{{ f.key }}:</span>
            <span class="ml-1 text-gray-600">{{ f.value }}</span>
          </li>
        </ul>
        <p class="mt-2 text-xs text-gray-500">
          File detection (build time, via runtimeConfig.public.fontPresence):
          <span class="ml-1">bodyFont.woff2 = <span :class="fontPresence.body ? 'text-green-700' : 'text-red-600'">{{ fontPresence.body ? "present" : "missing" }}</span></span>
          <span class="ml-3">headingFont.woff2 = <span :class="fontPresence.heading ? 'text-green-700' : 'text-red-600'">{{ fontPresence.heading ? "present" : "missing" }}</span></span>
        </p>
        <p class="mt-3 text-xs text-gray-500">
          Sample: <span class="font-headingFont text-base text-accentColor1">headingFont</span>
          <span class="mx-2">|</span>
          <span class="font-bodyFont">bodyFont paragraph text</span>
        </p>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Announcement (Supabase via useRuntimeConfigDB)</h2>
        <pre class="overflow-x-auto rounded bg-gray-50 p-3 text-xs">{{ JSON.stringify(runtimeDB.announcement, null, 2) }}</pre>
        <p class="mt-2 text-xs text-gray-500">
          Banner content from the <code>announcement</code> table.
        </p>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Branding payload (useCommon / site_branding)</h2>
        <pre class="overflow-x-auto rounded bg-gray-50 p-3 text-xs">{{ JSON.stringify(common, null, 2) }}</pre>
        <p class="mt-2 text-xs text-gray-500">
          Build-time fallback file: <code>data/common.json</code> (via <code>DEFAULT_BRANDING</code>).
        </p>
      </section>

      <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-3 font-headingFont text-base font-semibold text-accentColor1">Site config (Supabase via useRuntimeConfigDB)</h2>
        <pre class="overflow-x-auto rounded bg-gray-50 p-3 text-xs">{{ JSON.stringify(runtimeDB.siteConfig, null, 2) }}</pre>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCommon } from "~/composables/useCommon";
import { FONT_STACK_KEYS, type FontPresence } from "~/data/fonts";
import { useRuntimeConfigDB } from "~/composables/useRuntimeConfigDB";

if (import.meta.env.PROD) {
  throw createError({ statusCode: 404, statusMessage: "Not found" });
}

definePageMeta({ layout: false });

const common = useCommon();
const config = useRuntimeConfig();
// Vue auto-unwraps refs in templates, so `runtimeDB.siteConfig` works without `.value`.
const runtimeDB = useRuntimeConfigDB();

const orgName = computed(() => String(config.public.orgName ?? ""));

// File-system detection runs in nuxt.config.ts (via data/fonts.server.ts) and
// is exposed here so we don't import any node:fs code into the client bundle.
const fontPresence = computed<FontPresence>(
  () => (config.public.fontPresence as FontPresence) ?? { body: false, heading: false },
);

const documentTitle = ref("");
const cssVarValues = ref<Record<string, string>>({});
const fontVarValues = ref<Record<string, string>>({});

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
  const jsonColors = common.value.brand?.colors ?? {};
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

const fontRows = computed(() =>
  FONT_STACK_KEYS.map((key) => ({
    key,
    value: fontVarValues.value[key]?.trim() || "(SSR — refresh to read)",
  })),
);

const titleMatch = computed(() => {
  const expected = common.value.strings?.siteTitle?.trim() ?? "";
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
  for (const key of FONT_STACK_KEYS) {
    const v = getComputedStyle(root).getPropertyValue(`--${key}`).trim();
    fontVarValues.value = { ...fontVarValues.value, [key]: v || "" };
  }
});
// Intentionally no page title: inherits head from site-bootstrap (site_branding.site_title) for the title check.
</script>
