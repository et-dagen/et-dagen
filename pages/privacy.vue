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

  const sectionHeading = 'text-2xl font-extrabold tracking-tight'
  const prose = 'flex max-w-[68ch] flex-col gap-4'
  const list = [
    'flex max-w-[68ch] list-disc flex-col gap-2 pl-5',
    'marker:text-muted-foreground',
  ]
  const link = [
    'font-bold underline decoration-border decoration-2',
    'underline-offset-4 hover:decoration-brand',
  ]
</script>

<template>
  <div class="et-ui">
    <div
      class="mx-auto flex max-w-4xl flex-col gap-14 px-4 py-8 lg:px-8 lg:py-12"
    >
      <header class="flex flex-col gap-4">
        <h1
          class="text-4xl leading-[1.08] font-extrabold tracking-tight text-balance lg:text-[2.875rem]"
        >
          {{ $t('privacy.heading') }}
        </h1>
        <p class="max-w-[60ch] text-lg text-muted-foreground">
          {{ $t('privacy.lead') }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ $t('privacy.updated') }}
        </p>
        <nav
          :aria-label="$t('privacy.index')"
          class="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm font-bold"
        >
          <a
            v-for="section in SECTIONS"
            :key="section"
            :href="`#${section}`"
            class="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {{ $t(`privacy.${section}.title`) }}
          </a>
        </nav>
      </header>

      <section aria-labelledby="who" class="flex flex-col gap-4">
        <h2 id="who" :class="sectionHeading">{{ $t('privacy.who.title') }}</h2>
        <div :class="prose">
          <p v-for="(line, i) in lines('privacy.who.body')" :key="i">
            {{ line }}
          </p>
        </div>
        <a :href="`mailto:${email}`" :class="link" class="self-start">
          {{ email }}
        </a>
      </section>

      <section aria-labelledby="data" class="flex flex-col gap-6">
        <h2 id="data" :class="sectionHeading">
          {{ $t('privacy.data.title') }}
        </h2>
        <div :class="prose">
          <p v-for="(line, i) in lines('privacy.data.body')" :key="i">
            {{ line }}
          </p>
        </div>
        <div class="flex flex-col divide-y border-y">
          <article
            v-for="category in CATEGORIES"
            :key="category"
            :aria-labelledby="`data-${category}`"
            class="flex flex-col gap-3 py-6"
          >
            <h3 :id="`data-${category}`" class="text-lg font-extrabold">
              {{ $t(`privacy.data.${category}.title`) }}
            </h3>
            <dl
              class="grid gap-x-6 gap-y-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-y-3"
            >
              <template v-for="field in FIELDS" :key="field">
                <dt
                  class="text-sm font-semibold text-muted-foreground not-first:mt-2 sm:mt-0"
                >
                  {{ $t(`privacy.data.labels.${field}`) }}
                </dt>
                <dd class="max-w-[68ch]">
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
        class="flex flex-col gap-4"
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

      <section aria-labelledby="rights" class="flex flex-col gap-4">
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
          class="inline-flex items-center gap-1 self-start"
        >
          {{ $t('privacy.rights.authority') }}
          <ArrowUpRight aria-hidden="true" class="size-4" />
          <span class="sr-only">{{ $t('site.footer.external') }}</span>
        </a>
      </section>

      <section aria-labelledby="changes" class="flex flex-col gap-4">
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
