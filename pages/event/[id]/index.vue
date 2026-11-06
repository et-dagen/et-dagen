<script setup lang="ts">
  import { useAuthStore } from '@/stores/authStore'
  import { useCompanies } from '@/composables/useCompanies'
  import AboutPanel from '@/components/event/page/AboutPanel.vue'
  import CompanyJobs from '@/components/event/page/CompanyJobs.vue'
  import EventHeader from '@/components/event/page/EventHeader.vue'
  import SignupPanel from '@/components/event/page/SignupPanel.vue'
  import SignupRules from '@/components/event/page/SignupRules.vue'
  import { Instant } from '@/domain/time'
  import { placeOf } from '@/lib/events'
  import { companyOf } from '@/lib/auth/companyOf'
  import {
    calendarFileOf,
    isEventDay,
    openJobsOf,
    seatsOf,
    signupStateOf,
    ticketWhenOf,
    urgencyOf,
    type PublicEvent,
  } from '@/lib/eventPage'
  import type { StoredJob } from '@/lib/jobs'

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const auth = useAuthStore()
  const uid = String(useRoute().params.id)

  const [{ data: events, refresh }, { data: companies }, { data: jobs }] =
    await Promise.all([
      useFetch<Record<string, PublicEvent>>('/api/v1/event', {
        query: { eventUID: uid },
      }),
      useCompanies(),
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
    event.value ? seatsOf(event.value) : { taken: 0, limit: null, waiting: 0 },
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
      class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 lg:px-8 lg:py-12"
    >
      <EventHeader :event="event" :company="company" :urgency="urgency" />

      <aside
        class="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-2 lg:self-start"
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
            <div class="h-64 rounded-lg border bg-card" />
          </template>
        </ClientOnly>
      </aside>

      <article
        class="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-2"
      >
        <div
          role="tablist"
          :aria-label="$t('events.page.tabs.label')"
          class="flex gap-4 overflow-x-auto border-b sm:gap-6"
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
            class="-mb-px inline-flex h-11 shrink-0 items-center border-b-2 border-transparent pt-0.5 font-semibold whitespace-nowrap text-muted-foreground hover:text-foreground aria-selected:border-brand aria-selected:text-foreground"
            @click="tab = name"
          >
            <span class="sm:hidden">
              {{ $t(`events.page.tabs.${name}_short`) }}
            </span>
            <span class="hidden sm:inline">
              {{ $t(`events.page.tabs.${name}`) }}
            </span>
            <span
              v-if="tabCount(name)"
              class="ml-2 rounded-sm bg-muted px-1.5 pt-0.5 text-xs font-bold text-foreground tabular-nums"
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
      class="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16 lg:px-8"
    >
      <h1 class="text-2xl font-bold">{{ $t('events.page.missing') }}</h1>
      <NuxtLink :to="localePath('/programme')" class="font-semibold underline">
        {{ $t('events.page.back') }}
      </NuxtLink>
    </div>
  </div>
</template>
