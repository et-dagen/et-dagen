<script setup lang="ts">
  import { X } from '@lucide/vue'
  import { useMediaQuery } from '@vueuse/core'
  import { Button } from '@/components/ui/button'
  import { Separator } from '@/components/ui/separator'
  import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
  } from '@/components/ui/sheet'
  import NavButton from '@/components/site/NavButton.vue'
  import LocaleSwitcher from '@/components/site/LocaleSwitcher.vue'
  import UserStateButton from '@/components/site/SignInOutButton.vue'
  import { useAuthStore } from '@/stores/authStore'
  import { useNavDrawer } from '@/composables/useNavDrawer'
  import { routes } from '~/config/app.config'

  const auth = useAuthStore()
  const drawer = useNavDrawer()
  const wide = useMediaQuery('(min-width: 1280px)')

  // the menu only exists on phones and tablets; close it when the window grows past them
  watch(wide, () => (drawer.value = false))
</script>

<template>
  <Sheet v-model:open="drawer">
    <!-- the last child is the sheet's own close button; this menu keeps its close button on the left -->
    <SheetContent
      side="right"
      :aria-describedby="undefined"
      class="nav-drawer et-ui tw:w-full tw:gap-0 tw:p-4 tw:sm:max-w-none tw:min-[600px]:w-[400px] tw:[&>button:last-child]:hidden"
    >
      <SheetTitle class="tw:sr-only">{{ $t('nav.menu') }}</SheetTitle>

      <SheetClose as-child>
        <Button
          variant="ghost"
          :aria-label="$t('nav.close_menu')"
          class="tw:size-14 tw:rounded-full tw:hover:bg-black/4"
        >
          <X class="tw:size-6" aria-hidden="true" />
        </Button>
      </SheetClose>

      <nav class="tw:mt-4 tw:flex tw:flex-1 tw:flex-col tw:gap-4">
        <NavButton
          v-for="(route, index) in routes"
          :key="index"
          size="lg"
          :route="route"
        />
      </nav>

      <div class="tw:flex tw:flex-col tw:gap-4">
        <NavButton
          v-if="auth.isLoggedIn"
          size="lg"
          :route="{ name: 'user', route: '/user' }"
        />
        <NavButton
          v-if="auth.allows('company')"
          size="lg"
          :route="{ name: 'company', route: '/company/admin' }"
        />
        <NavButton
          v-if="auth.allows('admin')"
          size="lg"
          :route="{ name: 'admin', route: '/admin' }"
        />
      </div>

      <Separator
        class="tw:my-4 tw:bg-black/12 tw:data-[orientation=horizontal]:h-0.5"
      />

      <div class="tw:flex tw:justify-between">
        <UserStateButton />
        <LocaleSwitcher />
      </div>
    </SheetContent>
  </Sheet>
</template>

<style>
  /* the light scrim Vuetify's drawer had */
  [data-slot='sheet-overlay']:has(+ .nav-drawer) {
    background: rgb(0 0 0 / 0.32);
  }
</style>
