<script setup lang="ts">
  import AccountMenu from './AccountMenu.vue'
  import LanguageSwitch from './LanguageSwitch.vue'
  import NextUpPill from './NextUpPill.vue'
  import PhoneMenu from './PhoneMenu.vue'
  import { useAuthStore } from '@/stores/authStore'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/events'
  import { nextUp } from '@/lib/site/nextUp'
  import { usePageLoading } from '@/composables/usePageLoading'
  import { routes } from '~/config/app.config'

  const route = useRoute()
  const localePath = useLocalePath()
  const loading = usePageLoading()

  const isCurrent = (target: string) => {
    const path = localePath(target)
    return target === '/'
      ? route.path === path
      : route.path === path || route.path.startsWith(`${path}/`)
  }

  const current = computed(
    () => routes.find((page) => isCurrent(page.route))?.route ?? null,
  )

  // the pill depends on the clock, so it is worked out in the browser only
  const auth = useAuthStore()
  const { data: events, refresh: refreshEvents } = useFetch<
    Record<string, EventRow>
  >('/api/v1/event', {
    key: 'site-header-events',
    server: false,
    lazy: true,
  })
  // signing in or out changes whose events count as the visitor's own
  watch(
    () => auth.user?.uid,
    () => refreshEvents(),
  )
  const next = computed(() =>
    nextUp(events.value, Instant.now(), auth.user?.uid),
  )

  // out of the way while reading down the page, back as soon as the reader scrolls up
  const hidden = ref(false)
  let last = 0
  const onScroll = () => {
    const y = window.scrollY
    hidden.value = y > 120 && y > last
    last = y
  }
  onMounted(() =>
    window.addEventListener('scroll', onScroll, { passive: true }),
  )
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header
    class="et-ui sticky top-0 z-20 border-b bg-card transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:translate-y-0 motion-reduce:transition-none"
    :class="hidden && '-translate-y-full'"
  >
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
    >
      {{ $t('site.skip') }}
    </a>
    <div
      class="mx-auto flex h-16 max-w-screen-2xl items-center gap-6 px-4 lg:h-[4.25rem] lg:px-8"
    >
      <NuxtLink
        :to="localePath('/')"
        class="flex shrink-0 items-center gap-2.5"
      >
        <img
          src="/images/logo-small.webp"
          alt=""
          width="26"
          height="30"
          class="h-[30px] w-auto"
        />
        <span class="text-xl font-extrabold tracking-tight text-brand"
          >E&amp;T-dagene</span
        >
      </NuxtLink>

      <nav :aria-label="$t('site.menu.pages')" class="hidden lg:block">
        <ul class="flex items-center gap-6">
          <li v-for="page in routes" :key="page.name">
            <NuxtLink
              :to="localePath(page.route)"
              :aria-current="isCurrent(page.route) ? 'page' : undefined"
              class="block py-2 text-[15px] font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:shadow-[inset_0_-3px_0_var(--brand)]"
            >
              {{ $t(`nav.${page.name}`) }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="ml-auto flex min-w-0 items-center gap-3">
        <ClientOnly>
          <NextUpPill
            v-if="next"
            :next="next"
            class="hidden max-w-sm lg:flex"
          />
        </ClientOnly>
        <div class="hidden items-center gap-2 lg:flex">
          <LanguageSwitch />
          <AccountMenu />
        </div>
        <PhoneMenu
          :pages="routes"
          :current="current"
          :next="next"
          class="lg:hidden"
        />
      </div>
    </div>
    <div
      class="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-brand transition-opacity"
      :class="loading ? 'opacity-100 motion-safe:animate-pulse' : 'opacity-0'"
      aria-hidden="true"
    />
  </header>
</template>
