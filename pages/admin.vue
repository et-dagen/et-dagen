<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
  // route is only accessible by admins
  definePageMeta({
    protected: true,
    accessLevel: 'admin',
  })
</script>
