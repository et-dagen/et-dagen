<template>
  <VBtn
    rounded="lg"
    :prepend-icon="auth.isLoggedIn ? 'mdi-logout' : 'mdi-login'"
    variant="text"
    @click="auth.isLoggedIn ? signoutUser() : navigateTo('/user/login')"
  >
    {{ auth.isLoggedIn ? $t('user.sign_out') : $t('user.sign_in') }}
  </VBtn>
</template>

<script setup lang="ts">
  const auth = useAuthStore()
</script>
