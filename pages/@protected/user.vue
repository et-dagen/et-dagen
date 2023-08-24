<template>
  <div>Welcome {{ user?.email }}</div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>
