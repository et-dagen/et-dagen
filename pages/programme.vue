<script setup lang="ts">
  defineOptions({ name: 'Programme' })
</script>

<template>
  <div class="container">
    <h4 class="text-center pt-4 pb-7">{{ $t('program.title') }}</h4>
    <ProgrammeTimeline />
  </div>
</template>

<style scoped>
  .container {
    max-width: 95vw !important;
    margin: 0 auto;
  }
</style>
