<script setup lang="ts">
  import { ArrowUpRight } from '@lucide/vue'

  const { t, tm, rt } = useI18n()
  useHead(() => ({ title: t('privacy.title') }))

  // the IT manager's role address until the board sets up a dedicated privacy address
  const email = 'itansvarlig@et-dagen.no'

  const SECTIONS = [
    'who',
    'data',
    'processors',
    'cookies',
    'rights',
    'changes',
  ] as const
  const CATEGORIES = [
    'account',
    'diet',
    'events',
    'resume',
    'company',
    'board',
    'logs',
  ] as const
  const FIELDS = ['what', 'why', 'basis', 'who', 'kept'] as const

  /** The paragraphs or list items stored as an array under `key` */
  const lines = (key: string) =>
    (tm(key) as unknown as Parameters<typeof rt>[0][]).map((line) =>
      rt(line, { email }),
    )

  const sectionHeading = 'tw:text-2xl tw:font-extrabold tw:tracking-tight'
  const prose = 'tw:flex tw:max-w-[68ch] tw:flex-col tw:gap-4'
  const list = [
    'tw:flex tw:max-w-[68ch] tw:list-disc tw:flex-col tw:gap-2 tw:pl-5',
    'tw:marker:text-muted-foreground',
  ]
  const link = [
    'tw:font-bold tw:underline tw:decoration-border tw:decoration-2',
    'tw:underline-offset-4 tw:hover:decoration-brand',
  ]
</script>

<template>
  <div class="et-ui">
    <div
      class="tw:mx-auto tw:flex tw:max-w-4xl tw:flex-col tw:gap-14 tw:px-4 tw:py-8 tw:lg:px-8 tw:lg:py-12"
    >
      <header class="tw:flex tw:flex-col tw:gap-4">
        <h1
          class="tw:text-4xl tw:leading-[1.08] tw:font-extrabold tw:tracking-tight tw:text-balance tw:lg:text-[2.875rem]"
        >
          {{ $t('privacy.heading') }}
        </h1>
        <p class="tw:max-w-[60ch] tw:text-lg tw:text-muted-foreground">
          {{ $t('privacy.lead') }}
        </p>
        <p class="tw:text-sm tw:text-muted-foreground">
          {{ $t('privacy.updated') }}
        </p>
        <nav
          :aria-label="$t('privacy.index')"
          class="tw:mt-4 tw:flex tw:flex-wrap tw:gap-x-6 tw:gap-y-2 tw:border-t tw:pt-4 tw:text-sm tw:font-bold"
        >
          <a
            v-for="section in SECTIONS"
            :key="section"
            :href="`#${section}`"
            class="tw:text-muted-foreground tw:underline-offset-4 tw:hover:text-foreground tw:hover:underline"
          >
            {{ $t(`privacy.${section}.title`) }}
          </a>
        </nav>
      </header>

      <section aria-labelledby="who" class="tw:flex tw:flex-col tw:gap-4">
        <h2 id="who" :class="sectionHeading">{{ $t('privacy.who.title') }}</h2>
        <div :class="prose">
          <p v-for="(line, i) in lines('privacy.who.body')" :key="i">
            {{ line }}
          </p>
        </div>
        <a :href="`mailto:${email}`" :class="link" class="tw:self-start">
          {{ email }}
        </a>
      </section>

      <section aria-labelledby="data" class="tw:flex tw:flex-col tw:gap-6">
        <h2 id="data" :class="sectionHeading">
          {{ $t('privacy.data.title') }}
        </h2>
        <div class="tw:flex tw:flex-col tw:divide-y tw:border-y">
          <article
            v-for="category in CATEGORIES"
            :key="category"
            :aria-labelledby="`data-${category}`"
            class="tw:flex tw:flex-col tw:gap-3 tw:py-6"
          >
            <h3 :id="`data-${category}`" class="tw:text-lg tw:font-extrabold">
              {{ $t(`privacy.data.${category}.title`) }}
            </h3>
            <dl
              class="tw:grid tw:gap-x-6 tw:gap-y-1 tw:sm:grid-cols-[9rem_minmax(0,1fr)] tw:sm:gap-y-3"
            >
              <template v-for="field in FIELDS" :key="field">
                <dt
                  class="tw:text-sm tw:font-semibold tw:text-muted-foreground tw:not-first:mt-2 tw:sm:mt-0 tw:sm:pt-0.5"
                >
                  {{ $t(`privacy.data.labels.${field}`) }}
                </dt>
                <dd class="tw:max-w-[68ch]">
                  {{ $t(`privacy.data.${category}.${field}`) }}
                </dd>
              </template>
            </dl>
          </article>
        </div>
      </section>

      <section
        v-for="section in ['processors', 'cookies'] as const"
        :key="section"
        :aria-labelledby="section"
        class="tw:flex tw:flex-col tw:gap-4"
      >
        <h2 :id="section" :class="sectionHeading">
          {{ $t(`privacy.${section}.title`) }}
        </h2>
        <div :class="prose">
          <p v-for="(line, i) in lines(`privacy.${section}.body`)" :key="i">
            {{ line }}
          </p>
        </div>
        <ul :class="list">
          <li v-for="(item, i) in lines(`privacy.${section}.items`)" :key="i">
            {{ item }}
          </li>
        </ul>
      </section>

      <section aria-labelledby="rights" class="tw:flex tw:flex-col tw:gap-4">
        <h2 id="rights" :class="sectionHeading">
          {{ $t('privacy.rights.title') }}
        </h2>
        <div :class="prose">
          <p v-for="(line, i) in lines('privacy.rights.body')" :key="i">
            {{ line }}
          </p>
        </div>
        <a
          href="https://www.datatilsynet.no/"
          target="_blank"
          rel="noopener"
          :class="link"
          class="tw:inline-flex tw:items-center tw:gap-1 tw:self-start"
        >
          {{ $t('privacy.rights.authority') }}
          <ArrowUpRight aria-hidden="true" class="tw:size-4" />
          <span class="tw:sr-only">{{ $t('site.footer.external') }}</span>
        </a>
      </section>

      <section aria-labelledby="changes" class="tw:flex tw:flex-col tw:gap-4">
        <h2 id="changes" :class="sectionHeading">
          {{ $t('privacy.changes.title') }}
        </h2>
        <div :class="prose">
          <p v-for="(line, i) in lines('privacy.changes.body')" :key="i">
            {{ line }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
