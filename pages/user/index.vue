<template>
  <div>Welcome {{ user?.email }}</div>
</template>

<script setup lang="ts">
  definePageMeta({
    protected: true,
  })

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>
