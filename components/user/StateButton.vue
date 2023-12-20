<script setup lang="ts">
  const auth = useAuthStore()
  const appStore = useAppStore()
  const localePath = useLocalePath()
</script>

<template>
  <VBtn
    rounded="lg"
    :prepend-icon="auth.isLoggedIn ? 'mdi-logout' : 'mdi-login'"
    variant="text"
    @click="
      () => {
        auth.isLoggedIn ? signoutUser() : navigateTo(localePath('/user/signin'))
        appStore.drawer = false
      }
    "
  >
    {{ auth.isLoggedIn ? $t('user.sign_out') : $t('user.sign_in') }}
  </VBtn>
</template>
