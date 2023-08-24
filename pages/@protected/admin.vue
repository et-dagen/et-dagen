<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
  // route is only accessible by admins
  definePageMeta({
    accessLevel: 'admin',
  })
</script>
