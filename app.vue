<script setup lang="ts">
  const { finalizePendingLocaleChange } = useI18n()

  // wait for page transition to finish before resolbing locale
  const onBeforeEnter = async () => {
    await finalizePendingLocaleChange()
  }
</script>

<template>
  <VApp>
    <NuxtLayout>
      <!-- page transition -->
      <VFadeTransition mode="out-in" @before-enter="onBeforeEnter">
        <div :key="$route.fullPath">
          <NuxtPage />
        </div>
      </VFadeTransition>
    </NuxtLayout>
  </VApp>
</template>
