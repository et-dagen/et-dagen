<script setup lang="ts">
  import { ArrowUpRight, Check, Copy, MapPin, Navigation } from '@lucide/vue'
  import { Button } from '@/components/ui/button'

  const localePath = useLocalePath()
  const { locale } = useI18n()

  // Glassgården in Elektro A on MazeMap, NTNU's campus map; the site's `no` is MazeMap's `nb`
  const place = 'v=1&campusid=1&zlevel=1&center=10.401764,63.417953&zoom=18'
  const lang = computed(() => (locale.value === 'no' ? 'nb' : 'en'))
  const embed = computed(
    () => `https://use.mazemap.com/embed.html#${place}&lang=${lang.value}`,
  )
  const directions = computed(
    () =>
      `https://use.mazemap.com/#${place}&sharepoitype=poi&sharepoi=41755&lang=${lang.value}`,
  )

  const groups = [
    {
      title: 'site.footer.resources',
      links: [
        { label: 'nav.programme', to: '/programme' },
        { label: 'nav.jobs', to: '/jobs' },
        { label: 'nav.faq', to: '/faq' },
      ],
    },
    {
      title: 'site.footer.organisation',
      links: [
        { label: 'site.footer.contact', to: '/contact' },
        { name: 'MTELSYS', href: 'https://www.ntnu.no/studier/mtelsys' },
        { name: 'GitHub', href: 'https://github.com/et-dagen' },
      ],
    },
    {
      title: 'site.footer.follow',
      links: [
        { name: 'Instagram', href: 'https://www.instagram.com/etdagene/' },
        { name: 'Facebook', href: 'https://www.facebook.com/etdagen' },
        {
          name: 'LinkedIn',
          href: 'https://www.linkedin.com/company/elektronikk-og-teknologidagene-ntnu/',
        },
      ],
    },
  ]

  const mailboxes = [
    {
      role: 'contact.positions.business',
      email: 'bedriftansvarlig@et-dagen.no',
    },
    { role: 'contact.positions.logistics', email: 'logistikk@et-dagen.no' },
  ]

  const copied = ref<string | null>(null)
  let reset: ReturnType<typeof setTimeout> | undefined
  const copy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      return
    }
    copied.value = email
    clearTimeout(reset)
    reset = setTimeout(() => (copied.value = null), 2000)
  }
  onBeforeUnmount(() => clearTimeout(reset))
</script>

<template>
  <footer class="et-ui tw:mt-16 tw:border-t tw:bg-card tw:text-foreground">
    <div
      class="tw:mx-auto tw:grid tw:max-w-screen-2xl tw:gap-12 tw:px-4 tw:pt-12 tw:pb-8 tw:lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] tw:lg:gap-16 tw:lg:px-8 tw:lg:pt-14"
    >
      <section
        aria-labelledby="footer-place"
        class="tw:flex tw:flex-col tw:overflow-hidden tw:rounded-lg tw:border tw:bg-background"
      >
        <div class="tw:px-6 tw:pt-6">
          <h2
            id="footer-place"
            class="tw:text-2xl tw:font-black tw:tracking-tight tw:lg:text-3xl"
          >
            {{ $t('site.footer.place') }}
          </h2>
          <p class="tw:mt-1 tw:text-muted-foreground">
            {{ $t('site.footer.fair') }}
          </p>
        </div>
        <!-- the map is a picture of the place; a tap opens MazeMap, so the footer never traps a scroll -->
        <a
          :href="directions"
          target="_blank"
          rel="noopener"
          :aria-label="$t('site.footer.map_open')"
          class="tw:relative tw:mt-4 tw:block tw:h-72 tw:overflow-hidden tw:border-y tw:bg-muted"
        >
          <iframe
            :src="embed"
            title=""
            loading="lazy"
            referrerpolicy="no-referrer"
            tabindex="-1"
            aria-hidden="true"
            class="tw:pointer-events-none tw:block tw:size-full"
          />
          <span
            class="tw:pointer-events-none tw:absolute tw:top-1/2 tw:left-1/2 tw:flex tw:-translate-x-1/2 tw:-translate-y-full tw:flex-col tw:items-center"
            aria-hidden="true"
          >
            <span
              class="tw:mb-1 tw:rounded tw:bg-plate tw:px-2 tw:pt-1 tw:pb-0.5 tw:text-sm tw:font-extrabold tw:text-plate-foreground"
            >
              Glassgården
            </span>
            <MapPin
              class="tw:size-9 tw:fill-brand tw:text-card"
              stroke-width="1.5"
            />
          </span>
        </a>
        <div
          class="tw:flex tw:flex-wrap tw:items-center tw:gap-4 tw:bg-card tw:px-6 tw:py-4"
        >
          <address class="tw:not-italic">
            O.S. Bragstads plass 2, 7034 Trondheim
          </address>
          <Button
            as-child
            class="tw:h-11 tw:w-full tw:px-5 tw:text-base tw:font-bold tw:sm:ml-auto tw:sm:w-auto"
          >
            <a :href="directions" target="_blank" rel="noopener">
              <Navigation aria-hidden="true" />
              {{ $t('site.footer.directions') }}
            </a>
          </Button>
        </div>
      </section>

      <div class="tw:flex tw:flex-col">
        <nav
          :aria-label="$t('site.footer.links')"
          class="tw:grid tw:grid-cols-2 tw:gap-x-8 tw:gap-y-10 tw:sm:grid-cols-3"
        >
          <div v-for="group in groups" :key="group.title">
            <h3
              class="tw:text-xs tw:font-semibold tw:tracking-[0.08em] tw:text-muted-foreground tw:uppercase"
            >
              {{ $t(group.title) }}
            </h3>
            <ul class="tw:mt-4 tw:space-y-3">
              <li v-for="link in group.links" :key="link.to ?? link.href">
                <NuxtLink
                  v-if="link.to"
                  :to="localePath(link.to)"
                  class="tw:text-lg tw:font-semibold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-[6px] tw:hover:decoration-brand"
                >
                  {{ $t(link.label) }}
                </NuxtLink>
                <a
                  v-else
                  :href="link.href"
                  target="_blank"
                  rel="noopener"
                  class="tw:inline-flex tw:items-center tw:gap-1 tw:text-lg tw:font-semibold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-[6px] tw:hover:decoration-brand"
                >
                  {{ link.name }}
                  <ArrowUpRight
                    class="tw:size-4 tw:text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span class="tw:sr-only">{{
                    $t('site.footer.external')
                  }}</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <section
          aria-labelledby="footer-join"
          class="tw:mt-10 tw:border-t tw:pt-6"
        >
          <h3
            id="footer-join"
            class="tw:text-xs tw:font-semibold tw:tracking-[0.08em] tw:text-muted-foreground tw:uppercase"
          >
            {{ $t('site.footer.join') }}
          </h3>
          <ul class="tw:mt-4 tw:grid tw:gap-3">
            <li
              v-for="box in mailboxes"
              :key="box.email"
              class="tw:flex tw:items-center tw:gap-3 tw:rounded-lg tw:border tw:bg-card tw:px-4 tw:py-3"
            >
              <p class="tw:min-w-0">
                <span class="tw:block tw:text-sm tw:text-muted-foreground">
                  {{ $t(box.role) }}
                </span>
                <a
                  :href="`mailto:${box.email}`"
                  class="tw:block tw:truncate tw:text-lg tw:font-bold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-4 tw:hover:decoration-brand"
                >
                  {{ box.email }}
                </a>
              </p>
              <Button
                variant="outline"
                size="icon"
                class="tw:ml-auto tw:shrink-0"
                :aria-label="$t('site.footer.copy', { email: box.email })"
                @click="copy(box.email)"
              >
                <Check v-if="copied === box.email" aria-hidden="true" />
                <Copy v-else aria-hidden="true" />
              </Button>
            </li>
          </ul>
          <p class="tw:sr-only" aria-live="polite">
            {{ copied ? $t('site.footer.copied', { email: copied }) : '' }}
          </p>
        </section>
      </div>

      <p
        class="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:border-t tw:pt-6 tw:text-sm tw:text-muted-foreground tw:lg:col-span-2"
      >
        <img
          src="/images/logo.png"
          alt=""
          width="20"
          height="23"
          class="tw:h-[23px] tw:w-auto"
        />
        <span class="tw:font-bold tw:text-foreground">
          Elektronikk- og Teknologidagene
        </span>
        <span>O.S. Bragstads plass 2, 7034 Trondheim</span>
        <span aria-hidden="true" class="tw:hidden tw:sm:inline">·</span>
        <span>{{ $t('site.footer.org') }} 996 858 545</span>
      </p>
    </div>
  </footer>
</template>
