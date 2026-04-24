<template>
  <div
    :style="{
      '--site-announcement-height': siteAnnouncementHeight,
    } as Record<string, string>"
  >
    <LayoutAnnouncementBar />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import common from "~/data/common.json";

const siteAnnouncementHeight =
  common.announcement?.enabled === true ? "40px" : "0px";
</script>

<style>
/* Force scrollbar to always be visible to prevent layout shifts when content loads */
html {
  overflow-y: scroll;
}
</style>