<template>
  <template v-if="config.enabled">
    <!-- In-flow only: reserves 40px so the fixed bar does not leave an empty "hole" on scroll. -->
    <div class="h-10 w-full shrink-0" aria-hidden="true" />
    <div
      class="fixed left-0 right-0 top-0 z-[100] flex h-10 w-full items-center justify-center overflow-hidden border-b border-black/10 px-4 text-center text-sm leading-none"
      :style="barStyle"
      role="region"
      aria-label="Site announcement"
    >
      <NuxtLink
        v-if="shouldShowAsLink"
        to="/consultation"
        class="block max-w-full truncate font-medium no-underline hover:opacity-90"
        :style="textStyle"
      >
        {{ config.text }}
      </NuxtLink>
      <span
        v-else
        class="max-w-full truncate font-medium"
        :style="textStyle"
      >
        {{ config.text }}
      </span>
    </div>
  </template>
</template>

<script setup lang="ts">
// Announcement content lives in Supabase (`announcement` table) — read it
// via the runtime-config-db composable so dashboard edits surface here
// reactively (after cache invalidation / page reload).
//
// Link target is hardcoded to /consultation. The bar only renders as an
// active link when the user isn't already on /consultation or /checkout —
// clicking a link that takes you to the page you're already on is bad UX.
const route = useRoute();
const runtimeDB = useRuntimeConfigDB();

const config = computed(() => runtimeDB.value.announcement);

const shouldShowAsLink = computed(
  () =>
    !route.path.startsWith("/consultation") &&
    !route.path.startsWith("/checkout"),
);

const barStyle = computed(() => ({
  backgroundColor: config.value.backgroundColor,
}));

const textStyle = computed(() => ({
  color: config.value.textColor,
}));
</script>
