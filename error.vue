<template>
  <div class="d-flex h-screen align-center justify-center">
    <v-sheet class="text-center">
      <h1 class="text-orange text-h1 font-weight-bold pb-3">Oh no!</h1>
      <h4 class="text-h4 pb-1">Error {{ props.error.statusCode }}</h4>
      <h5 class="text-h5 pb-2" style="max-width: 90vw">
        {{ props.error.message }}
      </h5>
      <v-btn @click="handleError">Return to frontpage</v-btn>
    </v-sheet>
  </div>
</template>

<script setup>
  const props = defineProps({
    error: Object(),
  })

  const handleError = () =>
    clearError({
      redirect: '/',
    })
</script>
