<script setup lang="ts">
  // an address no page answers: error.vue shows it, with the status a missing page should have
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  })
</script>

<template>
  <div />
</template>
