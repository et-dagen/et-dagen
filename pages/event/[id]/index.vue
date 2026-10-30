<script setup lang="ts">
  import AboutPanel from '@/components/event/page/AboutPanel.vue'
  import CompanyJobs from '@/components/event/page/CompanyJobs.vue'
  import EventHeader from '@/components/event/page/EventHeader.vue'
  import SignupPanel from '@/components/event/page/SignupPanel.vue'
  import SignupRules from '@/components/event/page/SignupRules.vue'
  import { Instant } from '@/domain/time'
  import { placeOf } from '@/lib/admin/events'
  import { companyOf } from '@/lib/auth/companyOf'
  import {
    calendarFileOf,
    isEventDay,
    openJobsOf,
    placesOf,
    signupStateOf,
    ticketWhenOf,
    urgencyOf,
    type PublicEvent,
    type StoredJob,
  } from '@/lib/eventPage'

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const auth = useAuthStore()
  const uid = String(useRoute().params.id)

  const [{ data: events, refresh }, { data: companies }, { data: jobs }] =
    await Promise.all([
      useFetch<Record<string, PublicEvent>>('/api/v1/event', {
        query: { eventUID: uid },
      }),
      useFetch<
        Record<string, { name?: string; logo?: string; webpage?: string }>
      >('/api/v1/company'),
      useFetch<Record<string, StoredJob>>('/api/v1/job'),
    ])

  const event = computed(() => events.value?.[uid])
  // the header shows the visitor's next event, so it changes with a sign-up
  const changed = () =>
    Promise.all([refresh(), refreshNuxtData('site-header-events')])
  // admins, and coordinators of the hosting company or of E&T-dagene, take attendance at the door
  const mayScan = computed(() =>
    auth.can('event', 'markAttended', companyOf(event.value?.companyUID)),
  )
  const company = computed(
    () => companies.value?.[event.value?.companyUID ?? ''] ?? null,
  )
  const now = Instant.now()
  const visitor = computed(() =>
    auth.user
      ? {
          uid: auth.user.uid,
          studyProgram: auth.user.studyProgram,
          currentYear: auth.user.currentYear,
        }
      : null,
  )
  const state = computed(() =>
    event.value ? signupStateOf(event.value, visitor.value, now) : null,
  )
  const places = computed(() =>
    event.value ? placesOf(event.value) : { taken: 0, limit: null, waiting: 0 },
  )
  const urgency = computed(() =>
    event.value ? urgencyOf(event.value, now) : null,
  )

  const calendar = computed(() =>
    event.value && import.meta.client
      ? calendarFileOf(uid, event.value, window.location.href, now)
      : null,
  )
  const ticket = computed(() =>
    auth.user && event.value
      ? {
          uid: auth.user.uid,
          name: auth.user.name ?? auth.user.email ?? '',
          title: event.value.title ?? '',
          when: ticketWhenOf(event.value, locale.value),
          room: placeOf(event.value.location?.name).code,
        }
      : null,
  )

  const companyJobs = computed(() =>
    openJobsOf(jobs.value, event.value?.companyUID, now),
  )

  const TABS = ['about', 'signup', 'company'] as const
  type Tab = (typeof TABS)[number]
  const tab = ref<Tab>('about')
  const tabCount = (name: Tab) =>
    name === 'company' ? companyJobs.value.length : 0
  // arrow keys move between tabs, as people expect from a tab list
  function moveTab(step: number) {
    const next = (TABS.indexOf(tab.value) + step + TABS.length) % TABS.length
    tab.value = TABS[next]!
    nextTick(() => document.getElementById(`tab-${tab.value}`)?.focus())
  }

  useHead(() => ({ title: event.value?.title }))
</script>

<template>
  <div class="et-ui">
    <div
      v-if="event && state"
      class="tw:mx-auto tw:grid tw:max-w-6xl tw:gap-8 tw:px-4 tw:py-8 tw:lg:grid-cols-[minmax(0,1fr)_22rem] tw:lg:gap-12 tw:lg:px-8 tw:lg:py-12"
    >
      <EventHeader :event="event" :company="company" :urgency="urgency" />

      <aside
        class="tw:lg:sticky tw:lg:top-24 tw:lg:col-start-2 tw:lg:row-start-2 tw:lg:self-start"
      >
        <!-- the panel depends on who is signed in and the clock, so it draws in the browser -->
        <ClientOnly>
          <SignupPanel
            :event-uid="uid"
            :state="state"
            :places="places"
            :event-day="isEventDay(event, now)"
            :calendar="calendar"
            :ticket="ticket"
            :may-scan="mayScan"
            @changed="changed"
          />
          <template #fallback>
            <div class="tw:h-64 tw:rounded-lg tw:border tw:bg-card" />
          </template>
        </ClientOnly>
      </aside>

      <article
        class="tw:flex tw:min-w-0 tw:flex-col tw:gap-6 tw:lg:col-start-1 tw:lg:row-start-2"
      >
        <div
          role="tablist"
          :aria-label="$t('events.page.tabs.label')"
          class="tw:flex tw:gap-4 tw:overflow-x-auto tw:border-b tw:sm:gap-6"
          @keydown.right.prevent="moveTab(1)"
          @keydown.left.prevent="moveTab(-1)"
        >
          <button
            v-for="name in TABS"
            :id="`tab-${name}`"
            :key="name"
            role="tab"
            type="button"
            :aria-selected="tab === name"
            :aria-controls="`panel-${name}`"
            :tabindex="tab === name ? 0 : -1"
            class="tw:-mb-px tw:inline-flex tw:h-11 tw:shrink-0 tw:items-center tw:border-b-2 tw:border-transparent tw:pt-0.5 tw:font-semibold tw:whitespace-nowrap tw:text-muted-foreground tw:hover:text-foreground tw:aria-selected:border-brand tw:aria-selected:text-foreground"
            @click="tab = name"
          >
            <span class="tw:sm:hidden">
              {{ $t(`events.page.tabs.${name}_short`) }}
            </span>
            <span class="tw:hidden tw:sm:inline">
              {{ $t(`events.page.tabs.${name}`) }}
            </span>
            <span
              v-if="tabCount(name)"
              class="tw:ml-2 tw:rounded-sm tw:bg-muted tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-bold tw:text-foreground tw:tabular-nums"
              :aria-label="$t('events.page.tabs.jobs_count', tabCount(name))"
            >
              {{ tabCount(name) }}
            </span>
          </button>
        </div>

        <section
          v-show="tab === 'about'"
          id="panel-about"
          role="tabpanel"
          aria-labelledby="tab-about"
        >
          <AboutPanel :event="event" />
        </section>

        <section
          v-show="tab === 'signup'"
          id="panel-signup"
          role="tabpanel"
          aria-labelledby="tab-signup"
        >
          <SignupRules :event="event" :no-signup="state.kind === 'none'" />
        </section>

        <section
          v-show="tab === 'company'"
          id="panel-company"
          role="tabpanel"
          aria-labelledby="tab-company"
        >
          <CompanyJobs :jobs="companyJobs" :company="company" />
        </section>
      </article>
    </div>

    <div
      v-else
      class="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:items-start tw:gap-4 tw:px-4 tw:py-16 tw:lg:px-8"
    >
      <h1 class="tw:text-2xl tw:font-bold">{{ $t('events.page.missing') }}</h1>
      <NuxtLink
        :to="localePath('/programme')"
        class="tw:font-semibold tw:underline"
      >
        {{ $t('events.page.back') }}
      </NuxtLink>
    </div>
  </div>
</template>
