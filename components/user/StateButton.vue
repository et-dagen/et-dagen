<script setup lang="ts">
  import { useAuthStore } from '@/stores/authStore'
  import { signoutUser } from '@/composables/auth/session'
  import { useNavDrawer } from '@/composables/useNavDrawer'

  const auth = useAuthStore()
  const drawer = useNavDrawer()
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
        drawer = false
      }
    "
  >
    {{ auth.isLoggedIn ? $t('user.sign_out') : $t('user.sign_in') }}
  </VBtn>
</template>
