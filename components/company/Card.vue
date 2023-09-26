<script setup lang="ts">
  defineProps<{
    content: {
      logo: string
      website: string
    }
  }>()
</script>

<template>
  <VHover v-slot="{ isHovering, props }">
    <VCard
      :elevation="isHovering ? 10 : 0"
      :class="{ 'on-hover': isHovering }"
      class="mx-auto d-flex align-center justify-center"
      height="125"
      max-width="250"
      v-bind="props"
      @click="navigateTo(content.website, { external: true, open: 'target' })"
    >
      <VImg :width="500" aspect-ratio="4/3" cover :src="content.logo" />
    </VCard>
  </VHover>
</template>
