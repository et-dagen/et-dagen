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
        { label: 'nav.for-companies', to: '/for-companies' },
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
  <footer class="et-ui mt-16 border-t bg-card text-foreground">
    <div
      class="mx-auto grid max-w-screen-2xl gap-12 px-4 pt-12 pb-8 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:pt-14"
    >
      <section
        aria-labelledby="footer-place"
        class="flex flex-col overflow-hidden rounded-lg border bg-background"
      >
        <div class="px-6 pt-6">
          <h2
            id="footer-place"
            class="text-2xl font-black tracking-tight lg:text-3xl"
          >
            {{ $t('site.footer.place') }}
          </h2>
          <p class="mt-1 text-muted-foreground">
            {{ $t('site.footer.fair') }}
          </p>
        </div>
        <!-- the map is a picture of the place; a tap opens MazeMap, so the footer never traps a scroll -->
        <a
          :href="directions"
          target="_blank"
          rel="noopener"
          :aria-label="$t('site.footer.map_open')"
          class="relative mt-4 block h-72 overflow-hidden border-y bg-muted"
        >
          <iframe
            :src="embed"
            title=""
            loading="lazy"
            referrerpolicy="no-referrer"
            tabindex="-1"
            aria-hidden="true"
            class="pointer-events-none block size-full"
          />
          <span
            class="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center"
            aria-hidden="true"
          >
            <span
              class="mb-1 rounded bg-plate px-2 pt-1 pb-0.5 text-sm font-extrabold text-plate-foreground"
            >
              Glassgården
            </span>
            <MapPin class="size-9 fill-brand text-card" stroke-width="1.5" />
          </span>
        </a>
        <div class="flex flex-wrap items-center gap-4 bg-card px-6 py-4">
          <address class="not-italic">
            O.S. Bragstads plass 2, 7034 Trondheim
          </address>
          <Button
            as-child
            class="h-11 w-full px-5 text-base font-bold sm:ml-auto sm:w-auto"
          >
            <a :href="directions" target="_blank" rel="noopener">
              <Navigation aria-hidden="true" />
              {{ $t('site.footer.directions') }}
            </a>
          </Button>
        </div>
      </section>

      <div class="flex flex-col">
        <nav
          :aria-label="$t('site.footer.links')"
          class="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3"
        >
          <div v-for="group in groups" :key="group.title">
            <h3
              class="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
            >
              {{ $t(group.title) }}
            </h3>
            <ul class="mt-4 space-y-3">
              <li v-for="link in group.links" :key="link.to ?? link.href">
                <NuxtLink
                  v-if="link.to"
                  :to="localePath(link.to)"
                  class="text-lg font-semibold underline decoration-border decoration-2 underline-offset-[6px] hover:decoration-brand"
                >
                  {{ $t(link.label) }}
                </NuxtLink>
                <a
                  v-else
                  :href="link.href"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1 text-lg font-semibold underline decoration-border decoration-2 underline-offset-[6px] hover:decoration-brand"
                >
                  {{ link.name }}
                  <ArrowUpRight
                    class="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span class="sr-only">{{ $t('site.footer.external') }}</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <section aria-labelledby="footer-join" class="mt-10 border-t pt-6">
          <h3
            id="footer-join"
            class="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
          >
            {{ $t('site.footer.join') }}
          </h3>
          <ul class="mt-4 grid gap-3">
            <li
              v-for="box in mailboxes"
              :key="box.email"
              class="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <p class="min-w-0">
                <span class="block text-sm text-muted-foreground">
                  {{ $t(box.role) }}
                </span>
                <a
                  :href="`mailto:${box.email}`"
                  class="block truncate text-lg font-bold underline decoration-border decoration-2 underline-offset-4 hover:decoration-brand"
                >
                  {{ box.email }}
                </a>
              </p>
              <Button
                variant="outline"
                size="icon"
                class="ml-auto shrink-0"
                :aria-label="$t('site.footer.copy', { email: box.email })"
                @click="copy(box.email)"
              >
                <Check v-if="copied === box.email" aria-hidden="true" />
                <Copy v-else aria-hidden="true" />
              </Button>
            </li>
          </ul>
          <p class="sr-only" aria-live="polite">
            {{ copied ? $t('site.footer.copied', { email: copied }) : '' }}
          </p>
        </section>
      </div>

      <p
        class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-6 text-sm text-muted-foreground lg:col-span-2"
      >
        <img
          src="/images/logo-small.webp"
          alt=""
          width="20"
          height="23"
          class="h-[23px] w-auto"
        />
        <span class="font-bold text-foreground">
          Elektronikk- og Teknologidagene
        </span>
        <span>O.S. Bragstads plass 2, 7034 Trondheim</span>
        <span aria-hidden="true" class="hidden sm:inline">·</span>
        <span>{{ $t('site.footer.org') }} 996 858 545</span>
      </p>
    </div>
  </footer>
</template>
