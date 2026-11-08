<script setup lang="ts">
  import { LogIn, LogOut } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import { useAuthStore } from '@/stores/authStore'
  import { signoutUser } from '@/composables/auth/session'
  import { useNavDrawer } from '@/composables/useNavDrawer'

  const auth = useAuthStore()
  const drawer = useNavDrawer()
  const localePath = useLocalePath()
</script>

<template>
  <Button
    variant="ghost"
    class="tw:h-[52px] tw:gap-3 tw:rounded-lg tw:px-6 tw:has-[>svg]:px-6 tw:text-lg tw:font-medium tw:tracking-[0.0892em] tw:transition-colors tw:duration-400 tw:hover:bg-black/4"
    @click="
      () => {
        auth.isLoggedIn ? signoutUser() : navigateTo(localePath('/user/signin'))
        drawer = false
      }
    "
  >
    <LogOut v-if="auth.isLoggedIn" class="tw:size-5" aria-hidden="true" />
    <LogIn v-else class="tw:size-5" aria-hidden="true" />
    {{ auth.isLoggedIn ? $t('user.sign_out') : $t('user.sign_in') }}
  </Button>
</template>
