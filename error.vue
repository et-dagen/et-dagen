<script setup lang="ts">
  const props = defineProps({
    error: Object(),
  })

  const localePath = useLocalePath()

  const handleError = () =>
    clearError({
      redirect: localePath('/'),
    })
</script>

<template>
  <div class="d-flex h-screen justify-center">
    <VSheet class="text-center mt-10">
      <h1 class="text-orange text-h1 font-weight-bold pb-3">Oh no!</h1>
      <h4 class="text-h4 pb-1">Error {{ props.error.statusCode }}</h4>
      <h5 class="text-h5 pb-2 break-text">
        {{ props.error.message }}
      </h5>
      <VBtn @click="handleError">Return to frontpage</VBtn>
    </VSheet>
  </div>
</template>

<style scoped>
  .break-text {
    max-width: 90vw;
    word-wrap: break-word;
  }
</style>
