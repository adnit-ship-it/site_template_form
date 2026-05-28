<template></template>

<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/consultation', query: route.query }, { redirectCode: 301 })
</script>
