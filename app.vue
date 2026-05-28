<template>
  <div
    :style="{
      '--site-announcement-height': siteAnnouncementHeight,
    } as Record<string, string>"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// The `--site-announcement-height` CSS variable lives here at the app
// root because the (fixed-position) Navbar uses it to offset its own
// `top`. The actual <LayoutAnnouncementBar /> component is rendered from
// inside Navbar.vue so it naturally lives with the rest of the chrome.
//
// Sourced from Supabase via the runtime-config plugin → composable;
// reactive so flipping `announcement.enabled` in the dashboard updates
// the layout without a hard refresh.
const runtimeDB = useRuntimeConfigDB();
const siteAnnouncementHeight = computed(() =>
  runtimeDB.value.announcement.enabled ? "40px" : "0px",
);
</script>

<style>
/* Force scrollbar to always be visible to prevent layout shifts when content loads */
html {
  overflow-y: scroll;
}
</style>