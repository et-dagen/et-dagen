<script setup lang="ts">
  definePageMeta({
    // route and all sub routes are protected
    // meaning you have to be logged in
    protected: true,

    middleware: () => {
      const authStore = useAuthStore()
      const localePath = useLocalePath()

      if (authStore.hasAccess(['admin'])) return

      return navigateTo(localePath('/user/edit'))
    },
  })

  const { data } = await useFetch('/api/user', { query: { scope: 'all' } })

  const route = useRoute()
  const user = computed(() =>
    data.value.find((user) => user.uid === route.params.id),
  )

  // navigate to admin page if user doesn't exist
  if (!user.value) navigateTo('/admin/users')
</script>

<template>
  <VContainer>
    <UserEditForm :user="user" />
  </VContainer>
</template>

<style scoped lang="scss">
  .v-container {
    max-width: 26rem;
    margin-block: 0.5rem;
  }
</style>
