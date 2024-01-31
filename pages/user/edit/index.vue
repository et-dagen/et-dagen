<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    // meaning you hae to be logged in
    protected: true,
  })

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)
</script>

<template>
  <VContainer>
    <UserEditForm :user="user" />
  </VContainer>
</template>

<style lang="scss">
  .v-container {
    max-width: 26rem !important;
    margin-block: 0.5rem;
  }
</style>
