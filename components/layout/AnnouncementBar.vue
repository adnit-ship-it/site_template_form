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
        v-if="isInternalLink"
        :to="linkTrimmed"
        class="block max-w-full truncate font-medium no-underline hover:opacity-90"
        :style="textStyle"
      >
        {{ config.text }}
      </NuxtLink>
      <a
        v-else-if="linkTrimmed"
        :href="linkTrimmed"
        class="block max-w-full truncate font-medium no-underline hover:opacity-90"
        :style="textStyle"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ config.text }}
      </a>
      <span v-else class="max-w-full truncate font-medium" :style="textStyle">{{ config.text }}</span>
    </div>
  </template>
</template>

<script setup lang="ts">
import common from "~/data/common.json";

const raw = (common as { announcement?: AnnouncementConfig }).announcement;

type AnnouncementConfig = {
  enabled: boolean;
  text: string;
  link?: string;
  backgroundColor: string;
  textColor: string;
};

const config: AnnouncementConfig = {
  enabled: Boolean(raw?.enabled),
  text: typeof raw?.text === "string" ? raw.text : "",
  link: raw?.link,
  backgroundColor: raw?.backgroundColor ?? "#000000",
  textColor: raw?.textColor ?? "#ffffff",
};

const linkTrimmed = config.link?.trim() ?? "";
const isInternalLink = Boolean(linkTrimmed && linkTrimmed.startsWith("/") && !linkTrimmed.startsWith("//"));

const barStyle = {
  backgroundColor: config.backgroundColor,
};

const textStyle = {
  color: config.textColor,
};
</script>
