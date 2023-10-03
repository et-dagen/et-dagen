<script setup lang="ts">
  defineProps<{
    content: {
      logo: string
      website: string
    }
  }>()
</script>

<template>
  <VCard
    class="card pa-2"
    height="125"
    variant="flat"
    max-width="250"
    @click="navigateTo(content.website, { external: true, open: 'target' })"
  >
    <VImg :width="500" aspect-ratio="4/3" contain :src="content.logo" />
  </VCard>
</template>

<style scoped lang="scss">
  .card {
    color: transparent;
    background-color: transparent;
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    filter: grayscale(75%);

    &:hover {
      transform: scale(1.05);
      filter: grayscale(0%);
    }
  }
</style>
