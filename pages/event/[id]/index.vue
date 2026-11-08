<script setup lang="ts">
  import { ArrowLeft, ExternalLink, Pencil } from '@lucide/vue'
  import { useAuthStore } from '@/stores/authStore'
  import { useCompanies } from '@/composables/useCompanies'
  import { useProgrammes } from '@/composables/useProgrammes'
  import AboutPanel from '@/components/event/page/AboutPanel.vue'
  import CompanyJobs from '@/components/event/page/CompanyJobs.vue'
  import SignupPanel from '@/components/event/page/SignupPanel.vue'
  import { Button } from '@/components/ui/button'
  import { Card, CardTitle } from '@/components/ui/card'
  import { Instant } from '@/domain/time'
  import { companyOf } from '@/lib/auth/companyOf'
  import {
    calendarFileOf,
    openJobsOf,
    seatsOf,
    signupStateOf,
    type PublicEvent,
  } from '@/lib/eventPage'
  import type { StoredJob } from '@/lib/jobs'
  import { formatInstant, instantOf } from '@/lib/time'

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const auth = useAuthStore()
  const uid = String(useRoute().params.id)

  const [
    { data: events, refresh },
    { data: companies },
    { data: jobs },
    { nameOf },
  ] = await Promise.all([
    useFetch<Record<string, PublicEvent>>('/api/v1/event', {
      query: { eventUID: uid },
    }),
    useCompanies(),
    useFetch<Record<string, StoredJob>>('/api/v1/job'),
    useProgrammes(),
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
  const requirements = computed(() => {
    const stored = event.value?.registration?.requirements
    return {
      years: stored?.years ?? [],
      programmes: (stored?.programmes ?? []).map(nameOf),
    }
  })
  const calendar = computed(() =>
    event.value && import.meta.client
      ? calendarFileOf(uid, event.value, window.location.href, now)
      : null,
  )
  const companyJobs = computed(() =>
    openJobsOf(jobs.value, event.value?.companyUID, now),
  )

  // a stored time as the page has always shown it, such as "13. February 14:42"
  function dayMonthTime(value: string | undefined) {
    const at = instantOf(value)
    if (!at) return ''
    const day = formatInstant(at, 'en-GB', { day: 'numeric' })
    const month = formatInstant(at, locale.value, { month: 'long' })
    const time = formatInstant(at, 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${day}. ${month} ${time}`
  }
  const hasCapacity = computed(() => !!event.value?.capacity)

  useHead(() => ({ title: event.value?.title }))
</script>

<template>
  <div
    v-if="event && state"
    class="tw:mx-auto tw:grid tw:w-full tw:max-w-[420px] tw:grid-cols-1 tw:gap-4 tw:p-4 tw:[grid-template-areas:'image'_'details'_'attendants'_'description'] tw:min-[960px]:max-w-[750px] tw:min-[1280px]:max-w-[1080px] tw:min-[1280px]:grid-cols-[1.1fr_3fr] tw:min-[1280px]:[grid-template-areas:'details_image'_'attendants_description']"
  >
    <!-- company logo -->
    <Card
      class="tw:max-h-[300px] tw:flex-row tw:items-center tw:justify-center tw:gap-0 tw:rounded-lg tw:border-0 tw:p-4 tw:shadow-none tw:[grid-area:image]"
    >
      <img
        class="tw:max-h-full tw:max-w-full tw:object-contain"
        :src="company?.logo || '/images/logo_long.png'"
        :alt="company?.name ?? 'E&T-dagene'"
      />
    </Card>

    <!-- event description, and the company's open jobs; min-width lets a long title end in an ellipsis -->
    <div
      class="tw:flex tw:min-w-0 tw:flex-col tw:gap-4 tw:[grid-area:description]"
    >
      <AboutPanel :event="event" />
      <CompanyJobs v-if="companyJobs.length" :jobs="companyJobs" />
    </div>

    <!-- event details -->
    <Card
      class="tw:relative tw:gap-0 tw:rounded-lg tw:border-0 tw:py-0 tw:text-sm tw:leading-[1.425] tw:tracking-[0.0178571em] tw:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2),0_4px_5px_0_rgba(0,0,0,0.14),0_1px_10px_0_rgba(0,0,0,0.12)] tw:[grid-area:details]"
    >
      <Button
        v-if="auth.allows('admin')"
        as-child
        variant="ghost"
        size="icon"
        class="tw:absolute tw:top-2 tw:right-2 tw:size-10 tw:rounded-full tw:text-brand tw:hover:bg-brand/10 tw:hover:text-brand"
      >
        <NuxtLink :to="localePath(`/admin/events/${uid}`)">
          <Pencil class="tw:size-[18px]" />
        </NuxtLink>
      </Button>

      <CardTitle
        class="tw:truncate tw:px-4 tw:py-2 tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
      >
        {{ $t('event.page.details.name') }}
      </CardTitle>

      <div class="tw:px-4 tw:pt-2">
        <strong class="tw:font-bold"
          >{{ $t('event.page.details.from') }}:</strong
        >
        {{ dayMonthTime(event.date?.start) }}
      </div>

      <div class="tw:px-4 tw:pb-5">
        <strong class="tw:font-bold">{{ $t('event.page.details.to') }}:</strong>
        {{ dayMonthTime(event.date?.end) }}
      </div>

      <div v-if="hasCapacity" class="tw:flex tw:flex-wrap tw:px-4">
        <strong class="tw:mr-2 tw:font-bold"
          >{{ $t('event.page.details.reg_start') }}:
        </strong>
        <span>{{ dayMonthTime(event.registration?.start) }}</span>
      </div>

      <div v-if="hasCapacity" class="tw:flex tw:flex-wrap tw:px-4 tw:pb-5">
        <strong class="tw:mr-2 tw:font-bold"
          >{{ $t('event.page.details.reg_end') }}:
        </strong>
        <span>{{ dayMonthTime(event.registration?.end) }}</span>
      </div>

      <div class="tw:px-4 tw:pb-5">
        <strong class="tw:font-bold"
          >{{ $t('event.page.details.location') }}:
        </strong>
        <a
          v-if="event.location?.map"
          :href="event.location.map"
          class="tw:text-inherit tw:no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ event.location.name }}
          <ExternalLink
            class="tw:inline tw:size-3 tw:align-baseline tw:text-brand"
          />
        </a>
        <span v-else>{{ event.location?.name }}</span>
      </div>

      <div class="tw:px-4 tw:pb-5">
        <strong class="tw:font-bold"
          >{{ $t('event.page.details.host') }}:
        </strong>
        <a
          v-if="company"
          :href="company.webpage ?? undefined"
          class="tw:text-inherit tw:no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ company.name }}
          <ExternalLink
            class="tw:inline tw:size-3 tw:align-baseline tw:text-brand"
          />
        </a>
        <span v-else>{{ 'E&T-dagene' }}</span>
      </div>
    </Card>

    <!-- event registration; it depends on who is signed in and the clock, so it draws in the browser -->
    <ClientOnly>
      <SignupPanel
        class="tw:[grid-area:attendants]"
        :event-uid="uid"
        :state="state"
        :places="places"
        :requirements="requirements"
        :calendar="calendar"
        :ticket-uid="auth.user?.uid ?? null"
        :may-scan="mayScan"
        @changed="changed"
      />
      <template #fallback><div class="tw:[grid-area:attendants]" /></template>
    </ClientOnly>
  </div>

  <div v-else class="tw:mx-auto tw:w-full tw:max-w-[1080px] tw:p-4">
    <h1
      class="tw:my-4 tw:text-[2.125rem] tw:leading-[1.175] tw:tracking-[0.0073529em]"
    >
      {{ $t('events.page.missing') }}
    </h1>
    <Button
      as-child
      variant="ghost"
      class="tw:h-[52px] tw:rounded-[4px] tw:px-6 tw:text-lg tw:tracking-[0.0892857em] tw:text-brand tw:hover:bg-brand/5 tw:hover:text-brand"
    >
      <NuxtLink :to="localePath('/programme')">
        <ArrowLeft class="tw:size-5" />
        {{ $t('events.page.back') }}
      </NuxtLink>
    </Button>
  </div>
</template>
