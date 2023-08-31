<template>
  <div
    class="text-center border-1px pa-10"
    style="
      border: 1px solid black;
      border-radius: 10px;
      position: fixed;
      width: 350px;
      max-width: 90vw;
    "
  >
    <h1 class="text-h1 font-weight-bold" style="color: orange">Oops!</h1>
    <h2 class="text-h4">Error {{ error.statusCode }}</h2>
    <p class="text-h5" style="word-break: break-word; max-width: 100%">
      {{ error.message }}
    </p>
    <NuxtLink to="/" class="text-h6">Tilbake til forsiden</NuxtLink>
  </div>
</template>

<script setup lang="ts">
  defineProps(['error'])
</script>
