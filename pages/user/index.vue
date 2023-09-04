<template>
  <div>Welcome {{ user?.name }}!</div>
</template>

<script setup lang="ts">
  definePageMeta({
    // route is protected
    protected: true,
  })

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>
