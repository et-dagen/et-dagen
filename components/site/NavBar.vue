<script setup lang="ts">
  import { Menu } from '@lucide/vue'
  import { useEventListener } from '@vueuse/core'
  import { Button } from '@/components/ui/button'
  import NavButton from '@/components/site/NavButton.vue'
  import LocaleSwitcher from '@/components/site/LocaleSwitcher.vue'
  import UserMenu from '@/components/site/UserMenu.vue'
  import UserStateButton from '@/components/site/SignInOutButton.vue'
  import { useAuthStore } from '@/stores/authStore'
  import { useNavDrawer } from '@/composables/useNavDrawer'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { routes } from '~/config/app.config'

  const localePath = useLocalePath()

  const auth = useAuthStore()
  const drawer = useNavDrawer()
  const loading = usePageLoading()

  // hides while scrolling down past the threshold and returns on the way up, as Vuetify's app bar did
  const threshold = 300
  const hidden = ref(false)
  let lastY = 0
  useEventListener(
    'scroll',
    () => {
      const y = window.scrollY
      hidden.value = y > lastY && y > threshold
      lastY = y
    },
    { passive: true },
  )
</script>

<template>
  <header
    class="tw:fixed tw:inset-x-0 tw:top-0 tw:z-40 tw:bg-white tw:shadow-[0_2px_1px_-1px_rgba(0,0,0,.2),0_1px_1px_0_rgba(0,0,0,.14),0_1px_3px_0_rgba(0,0,0,.12)] tw:transition-transform tw:duration-200 tw:ease-[cubic-bezier(0.4,0,0.2,1)]"
    :class="{ 'tw:-translate-y-full': hidden }"
  >
    <div
      class="tw:flex tw:h-[90px] tw:items-center tw:px-4 tw:min-[960px]:px-12"
    >
      <!-- logo -->
      <div
        class="tw:flex tw:min-w-0 tw:flex-1 tw:basis-0 tw:items-center tw:px-5"
      >
        <NuxtLink :to="localePath('/')">
          <img width="30" src="/images/logo.png" alt="E&amp;T-dagene" />
        </NuxtLink>
      </div>

      <!-- nav buttons -->
      <nav class="tw:hidden tw:items-center tw:gap-2 tw:min-[1280px]:flex">
        <NavButton
          v-for="(route, index) in routes"
          :key="index"
          :route="route"
          class="tw:m-2"
        />
      </nav>

      <div
        class="tw:flex tw:min-w-0 tw:flex-1 tw:basis-0 tw:items-center tw:justify-end tw:px-5"
      >
        <LocaleSwitcher class="tw:mx-2 tw:hidden tw:min-[1280px]:flex" />

        <!-- sign in or out btn -->
        <UserStateButton
          v-if="!auth.isLoggedIn"
          class="tw:hidden tw:min-[1280px]:flex"
        />

        <!-- user menu -->
        <UserMenu v-else />

        <!-- open navigation drawer -->
        <Button
          variant="ghost"
          :aria-label="$t('nav.menu')"
          class="tw:size-16 tw:rounded-full tw:hover:bg-black/4 tw:min-[1280px]:hidden"
          @click="drawer = true"
        >
          <Menu class="tw:size-6" aria-hidden="true" />
        </Button>
      </div>
    </div>

    <!-- shows while a page loads -->
    <div class="tw:h-px tw:overflow-hidden">
      <div v-if="loading" class="loading-bar tw:h-full tw:bg-[#C33C3B]" />
    </div>
  </header>
</template>

<style scoped>
  .loading-bar {
    width: 40%;
    animation: loading 1.2s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
  }

  @keyframes loading {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(250%);
    }
  }
</style>
