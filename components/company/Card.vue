<script setup lang="ts">
  defineProps<{
    content: {
      logo: string
      webpage: string
    }
  }>()
</script>

<template>
  <VCard
    class="card pa-2 d-flex"
    height="125"
    variant="flat"
    max-width="250"
    @click="
      navigateTo(content.webpage, {
        external: true,
        open: { target: '_blank' },
      })
    "
  >
    <NuxtImg :src="content.logo" />
  </VCard>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  img {
    object-fit: contain;
    position: absolute;
    margin: auto;
    right: 0;
    left: 0;
    top: 0;
    bottom: 0;
    max-width: 100%;
    object-fit: contain;
    max-height: 100%;
  }

  .card {
    color: transparent;
    background-color: transparent;
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &:hover {
      transform: scale(1.05);
    }
  }
</style>
