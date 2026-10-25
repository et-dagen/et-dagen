<script setup lang="ts">
  import { LogIn, LogOut } from '@lucide/vue'
  import { accountLinks, initialsOf } from '@/lib/site/account'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'

  const auth = useAuthStore()
  const localePath = useLocalePath()
  const links = computed(() => accountLinks(auth.user?.userType))
</script>

<template>
  <DropdownMenu v-if="auth.isLoggedIn">
    <DropdownMenuTrigger
      class="tw:grid tw:size-9 tw:place-items-center tw:rounded-full tw:bg-plate tw:text-sm tw:font-extrabold tw:text-plate-foreground tw:outline-offset-2 tw:hover:bg-plate/90"
      :aria-label="$t('site.account.open', { name: auth.user?.name ?? '' })"
    >
      {{ initialsOf(auth.user?.name) || '?' }}
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="tw:w-56">
      <DropdownMenuLabel class="tw:truncate tw:font-bold">
        {{ auth.user?.name }}
      </DropdownMenuLabel>
      <DropdownMenuItem v-for="link in links" :key="link.route" as-child>
        <NuxtLink :to="localePath(link.route)">{{ $t(link.label) }}</NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select="signoutUser()">
        <LogOut aria-hidden="true" />
        {{ $t('user.sign_out') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
  <Button v-else as-child variant="outline" size="sm">
    <NuxtLink :to="localePath('/user/signin')">
      <LogIn aria-hidden="true" />
      {{ $t('user.sign_in') }}
    </NuxtLink>
  </Button>
</template>
