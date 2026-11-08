<script setup lang="ts">
  import { LogOut, User } from '@lucide/vue'
  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
  import { useAuthStore } from '@/stores/authStore'
  import { signoutUser } from '@/composables/auth/session'

  const auth = useAuthStore()
  const localePath = useLocalePath()

  // the panels sit here, so the app bar keeps room for the pages on a laptop
  const links = computed(() =>
    [
      { name: 'user', route: '/user', show: true },
      {
        name: 'company',
        route: '/company/admin',
        show: auth.allows('company'),
      },
      { name: 'admin', route: '/admin', show: auth.allows('admin') },
    ].filter((link) => link.show),
  )

  const item = [
    'tw:h-[52px] tw:cursor-pointer tw:justify-center tw:gap-3 tw:rounded-lg tw:px-6',
    'tw:text-lg tw:font-medium tw:tracking-[0.0892em] tw:text-black tw:focus:bg-black/4',
  ].join(' ')
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        :aria-label="$t('nav.account')"
        class="tw:mx-2 tw:hidden tw:size-16 tw:rounded-full tw:hover:bg-black/4 tw:data-[state=open]:bg-black/12 tw:min-[1280px]:flex"
      >
        <User class="tw:size-6" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      :side-offset="8"
      class="et-ui tw:flex tw:min-w-0 tw:flex-col tw:gap-2 tw:rounded-lg tw:border-0 tw:p-2 tw:shadow-[0_3px_3px_-2px_rgba(0,0,0,.2),0_3px_4px_0_rgba(0,0,0,.14),0_1px_8px_0_rgba(0,0,0,.12)]"
    >
      <DropdownMenuItem
        v-for="link in links"
        :key="link.name"
        as-child
        :class="item"
      >
        <NuxtLink :to="localePath(link.route)">
          {{ $t(`nav.${link.name}`) }}
        </NuxtLink>
      </DropdownMenuItem>

      <DropdownMenuItem :class="item" @select="signoutUser()">
        <LogOut class="tw:size-5 tw:text-current" aria-hidden="true" />
        {{ $t('user.sign_out') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
