<template>
  <VMain>
    <nuxt-link to="/">Home</nuxt-link>
    <nuxt-link to="/protected">Protected</nuxt-link>
    <nuxt-link v-if="isAdmin" to="/admin">Admin</nuxt-link>
    <slot />
  </VMain>
</template>

<script setup lang="ts" ?>
  const auth = useAuthStore()
  const isAdmin = computed(() => auth.hasAccessLevel('admin'))
</script>
