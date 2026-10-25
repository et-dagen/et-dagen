<script setup lang="ts">
  import AccountMenu from './AccountMenu.vue'
  import LanguageSwitch from './LanguageSwitch.vue'
  import NextUpPill from './NextUpPill.vue'
  import PhoneMenu from './PhoneMenu.vue'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/admin/events'
  import { nextUp } from '@/lib/site/nextUp'
  import { routes } from '~/config/app.config'

  const route = useRoute()
  const localePath = useLocalePath()
  const app = useAppStore()

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
  const { data: events } = useFetch<Record<string, EventRow>>('/api/v1/event', {
    key: 'site-header-events',
    server: false,
    lazy: true,
  })
  const next = computed(() => nextUp(events.value, Instant.now()))

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
    class="et-ui tw:sticky tw:top-0 tw:z-20 tw:border-b tw:bg-card tw:transition-transform tw:duration-300 tw:focus-within:translate-y-0 tw:motion-reduce:transition-none"
    :class="hidden && 'tw:-translate-y-full'"
  >
    <a
      href="#main"
      class="tw:sr-only tw:focus:not-sr-only tw:focus:absolute tw:focus:top-2 tw:focus:left-2 tw:focus:rounded-md tw:focus:bg-card tw:focus:px-3 tw:focus:py-2 tw:focus:shadow"
    >
      {{ $t('site.skip') }}
    </a>
    <div
      class="tw:mx-auto tw:flex tw:h-16 tw:max-w-screen-2xl tw:items-center tw:gap-6 tw:px-4 tw:lg:h-[4.25rem] tw:lg:px-8"
    >
      <NuxtLink
        :to="localePath('/')"
        class="tw:flex tw:shrink-0 tw:items-center tw:gap-2.5"
      >
        <img
          src="/images/logo.png"
          alt=""
          width="26"
          height="30"
          class="tw:h-[30px] tw:w-auto"
        />
        <span
          class="tw:text-xl tw:font-extrabold tw:tracking-tight tw:text-brand"
          >E&amp;T-dagene</span
        >
      </NuxtLink>

      <nav :aria-label="$t('site.menu.pages')" class="tw:hidden tw:lg:block">
        <ul class="tw:flex tw:items-center tw:gap-6">
          <li v-for="page in routes" :key="page.name">
            <NuxtLink
              :to="localePath(page.route)"
              :aria-current="isCurrent(page.route) ? 'page' : undefined"
              class="tw:block tw:py-2 tw:text-[15px] tw:font-semibold tw:whitespace-nowrap tw:text-muted-foreground tw:transition-colors tw:hover:text-foreground tw:aria-[current=page]:text-foreground tw:aria-[current=page]:shadow-[inset_0_-3px_0_var(--brand)]"
            >
              {{ $t(`nav.${page.name}`) }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="tw:ml-auto tw:flex tw:min-w-0 tw:items-center tw:gap-3">
        <ClientOnly>
          <NextUpPill
            v-if="next"
            :next="next"
            class="tw:hidden tw:max-w-sm tw:xl:flex"
          />
        </ClientOnly>
        <div class="tw:hidden tw:items-center tw:gap-2 tw:lg:flex">
          <LanguageSwitch />
          <AccountMenu />
        </div>
        <PhoneMenu
          :pages="routes"
          :current="current"
          :next="next"
          class="tw:lg:hidden"
        />
      </div>
    </div>
    <div
      class="tw:absolute tw:inset-x-0 tw:-bottom-px tw:h-0.5 tw:origin-left tw:bg-brand tw:transition-opacity"
      :class="
        app.loading
          ? 'tw:opacity-100 tw:motion-safe:animate-pulse'
          : 'tw:opacity-0'
      "
      aria-hidden="true"
    />
  </header>
</template>
