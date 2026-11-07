<script setup lang="ts">
  import { useAuthStore } from '@/stores/authStore'
  import { useCompanies } from '@/composables/useCompanies'
  import { useProgrammes } from '@/composables/useProgrammes'
  import AboutPanel from '@/components/event/page/AboutPanel.vue'
  import CompanyJobs from '@/components/event/page/CompanyJobs.vue'
  import SignupPanel from '@/components/event/page/SignupPanel.vue'
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
  <VContainer v-if="event && state" class="container">
    <!-- company logo -->
    <VCard
      class="d-flex justify-center align-center pa-4 image-container"
      flat
      rounded="lg"
    >
      <img
        class="image"
        :src="company?.logo || '/images/logo_long.png'"
        :alt="company?.name ?? 'E&T-dagene'"
      />
    </VCard>

    <!-- event description, and the company's open jobs -->
    <div class="description-column">
      <AboutPanel :event="event" />
      <CompanyJobs v-if="companyJobs.length" :jobs="companyJobs" />
    </div>

    <!-- event details -->
    <VCard class="details elevation-4" rounded="lg">
      <VBtn
        v-if="auth.allows('admin')"
        class="edit-event"
        variant="text"
        icon="mdi-pencil"
        size="small"
        color="primary"
        :to="localePath(`/admin/events/${uid}`)"
      />

      <VCardTitle class="details__title">
        {{ $t('event.page.details.name') }}
      </VCardTitle>

      <VCardText class="details__from pt-2 pb-0">
        <strong>{{ $t('event.page.details.from') }}:</strong>
        {{ dayMonthTime(event.date?.start) }}
      </VCardText>

      <VCardText class="details__to py-0 pb-5">
        <strong>{{ $t('event.page.details.to') }}:</strong>
        {{ dayMonthTime(event.date?.end) }}
      </VCardText>

      <VCardText
        v-if="hasCapacity"
        class="details__from py-0 pb-0 d-flex flex-wrap"
      >
        <strong class="mr-2">{{ $t('event.page.details.reg_start') }}: </strong>
        <span>{{ dayMonthTime(event.registration?.start) }}</span>
      </VCardText>

      <VCardText
        v-if="hasCapacity"
        class="details__to py-0 pb-5 d-flex flex-wrap"
      >
        <strong class="mr-2">{{ $t('event.page.details.reg_end') }}: </strong>
        <span>{{ dayMonthTime(event.registration?.end) }}</span>
      </VCardText>

      <VCardText class="details__location py-0 pb-5">
        <strong>{{ $t('event.page.details.location') }}: </strong>
        <a
          v-if="event.location?.map"
          :href="event.location.map"
          class="link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ event.location.name }}
          <VIcon size="x-small" color="primary">mdi-open-in-new</VIcon>
        </a>
        <span v-else>{{ event.location?.name }}</span>
      </VCardText>

      <VCardText class="details__host py-0 pb-5">
        <strong>{{ $t('event.page.details.host') }}: </strong>
        <a
          v-if="company"
          :href="company.webpage ?? undefined"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ company.name }}
          <VIcon size="x-small" color="primary">mdi-open-in-new</VIcon>
        </a>
        <span v-else>{{ 'E&T-dagene' }}</span>
      </VCardText>
    </VCard>

    <!-- event registration; it depends on who is signed in and the clock, so it draws in the browser -->
    <ClientOnly>
      <SignupPanel
        :event-uid="uid"
        :state="state"
        :places="places"
        :requirements="requirements"
        :calendar="calendar"
        :ticket-uid="auth.user?.uid ?? null"
        :may-scan="mayScan"
        @changed="changed"
      />
      <template #fallback><div /></template>
    </ClientOnly>
  </VContainer>

  <VContainer v-else class="missing">
    <h1 class="text-h4 my-4">{{ $t('events.page.missing') }}</h1>
    <VBtn
      variant="text"
      color="primary"
      prepend-icon="mdi-arrow-left"
      :to="localePath('/programme')"
    >
      {{ $t('events.page.back') }}
    </VBtn>
  </VContainer>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  .container {
    display: grid;
    width: 100vw;
    grid-template-columns: 1.1fr 3fr;
    gap: 1rem;
    grid-template-areas: 'details image' 'attendants description';

    .image-container {
      max-height: 300px;

      .image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .description-column {
      grid-area: description;
      // lets the card shrink, so a long title ends in an ellipsis as it did in the grid before
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .details {
      grid-area: details;

      .edit-event {
        position: absolute;
        right: 0.5rem;
        top: 0.5rem;
      }
    }

    @media #{map.get(settings.$display-breakpoints, 'lg-and-up')} {
      max-width: 1080px;
    }

    @media #{map.get(settings.$display-breakpoints, 'md-and-down')} {
      max-width: 750px;
      grid-template-areas: 'image' 'details' 'attendants' 'description';
      grid-template-columns: 1fr;
    }

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      max-width: 420px;
    }
  }

  .missing {
    max-width: 1080px;
  }
</style>
