<script setup lang="ts">
  import {
    ArrowLeft,
    CalendarClock,
    ExternalLink,
    MapPin,
    Users,
  } from '@lucide/vue'
  import { companyOf } from '@/lib/auth/companyOf'
  import CompanyLogo from '@/components/admin/CompanyLogo.vue'
  import DeadlineNote from '@/components/job/DeadlineNote.vue'
  import SignupPanel from '@/components/event/page/SignupPanel.vue'
  import { Button } from '@/components/ui/button'
  import { Instant } from '@/domain/time'
  import { placeOf } from '@/lib/admin/events'
  import { formatWhen } from '@/lib/admin/time'
  import {
    calendarFileOf,
    isEventDay,
    mapEmbedOf,
    placesOf,
    signupStateOf,
    urgencyOf,
    type PublicEvent,
  } from '@/lib/eventPage'
  import { deadlineState, formatDeadline } from '@/lib/jobs'

  interface StoredJob {
    title?: string
    companyUID?: string
    deadline?: string | null
  }

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
  const place = computed(() => placeOf(event.value?.location?.name))
  const urgency = computed(() =>
    event.value ? urgencyOf(event.value, now) : null,
  )
  const mapEmbed = computed(() => mapEmbedOf(event.value?.location?.map))

  const when = computed(() => {
    const start = formatWhen(event.value?.date?.start, locale.value)
    const end = formatWhen(event.value?.date?.end, locale.value, {
      hour: '2-digit',
      minute: '2-digit',
    })
    return end ? `${start}–${end}` : start
  })
  // the ticket keeps its time on one line: day and hours only
  const ticketWhen = computed(() => {
    const start = formatWhen(event.value?.date?.start, locale.value, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    const end = formatWhen(event.value?.date?.end, locale.value, {
      hour: '2-digit',
      minute: '2-digit',
    })
    return end ? `${start}–${end}` : start
  })
  const windowText = (value: string | undefined) =>
    formatWhen(value, locale.value)

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
          when: ticketWhen.value,
          room: place.value.code,
        }
      : null,
  )

  const companyJobs = computed(() =>
    Object.entries(jobs.value ?? {})
      .filter(([, job]) => job.companyUID === event.value?.companyUID)
      .map(([jobUid, job]) => ({
        uid: jobUid,
        title: job.title ?? '',
        deadline: job.deadline,
        state: deadlineState(job.deadline ?? undefined, now),
      }))
      .filter((job) => job.state.kind !== 'passed'),
  )

  const requirements = computed(() => event.value?.registration?.requirements)
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
      <header class="tw:flex tw:flex-col tw:gap-5 tw:lg:col-span-2">
        <NuxtLink
          :to="localePath('/programme')"
          class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
        >
          <ArrowLeft class="tw:size-4" aria-hidden="true" />
          {{ $t('events.page.back') }}
        </NuxtLink>
        <div v-if="company" class="tw:flex tw:items-center tw:gap-3">
          <CompanyLogo :src="company.logo" :name="company.name" size="lg" />
          <span class="tw:font-semibold">{{ company.name }}</span>
        </div>
        <h1
          class="tw:max-w-4xl tw:text-3xl tw:leading-tight tw:font-extrabold tw:tracking-tight tw:text-balance tw:lg:text-[2.75rem]"
        >
          {{ event.title }}
        </h1>
        <dl
          class="tw:flex tw:flex-wrap tw:gap-x-8 tw:gap-y-3 tw:border-t tw:pt-5"
        >
          <div class="tw:flex tw:items-center tw:gap-2">
            <dt>
              <CalendarClock
                class="tw:size-4 tw:text-muted-foreground"
                :aria-label="$t('events.page.when')"
              />
            </dt>
            <dd class="tw:font-medium tw:tabular-nums">{{ when }}</dd>
          </div>
          <div
            v-if="event.location?.name"
            class="tw:flex tw:items-center tw:gap-2"
          >
            <dt>
              <span
                v-if="place.code"
                class="tw:rounded-sm tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-sm tw:font-extrabold tw:text-plate-foreground"
              >
                {{ place.code }}
              </span>
              <MapPin
                v-else
                class="tw:size-4 tw:text-muted-foreground"
                :aria-label="$t('events.page.where')"
              />
            </dt>
            <dd class="tw:font-medium">
              <a
                v-if="event.location.map"
                :href="event.location.map"
                target="_blank"
                rel="noopener noreferrer"
                class="tw:underline tw:decoration-border tw:underline-offset-4 tw:hover:decoration-current"
              >
                {{ place.name || event.location.name }}
              </a>
              <template v-else>{{
                place.name || event.location.name
              }}</template>
            </dd>
          </div>
          <div v-if="places.limit" class="tw:flex tw:items-center tw:gap-2">
            <dt>
              <Users
                class="tw:size-4 tw:text-muted-foreground"
                :aria-label="$t('events.page.signup')"
              />
            </dt>
            <dd class="tw:font-medium tw:tabular-nums">
              {{
                $t('events.page.places', {
                  taken: places.taken,
                  limit: places.limit,
                })
              }}
            </dd>
            <dd
              v-if="urgency"
              class="tw:rounded-sm tw:bg-signal tw:px-2 tw:pt-0.5 tw:text-sm tw:font-bold tw:text-signal-foreground"
            >
              {{
                urgency.kind === 'closing'
                  ? $t('events.page.urgency.closing', urgency.hours)
                  : $t('events.page.urgency.few', urgency.left)
              }}
            </dd>
          </div>
        </dl>
      </header>

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
          class="tw:flex tw:flex-col tw:gap-6"
        >
          <!-- the API cleans descriptions before they reach the page -->
          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="event.description"
            class="et-prose"
            v-html="event.description"
          />
          <!-- eslint-enable vue/no-v-html -->
          <iframe
            v-if="mapEmbed"
            :src="mapEmbed"
            :title="
              $t('events.page.map_title', { place: event.location?.name })
            "
            loading="lazy"
            referrerpolicy="no-referrer"
            class="tw:h-72 tw:w-full tw:rounded-lg tw:border tw:bg-card"
          />
          <a
            v-else-if="event.location?.map"
            :href="event.location.map"
            target="_blank"
            rel="noopener noreferrer"
            class="tw:inline-flex tw:w-fit tw:items-center tw:gap-2 tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
          >
            <MapPin class="tw:size-4" aria-hidden="true" />
            {{ $t('events.page.open_map') }}
            <ExternalLink class="tw:size-3.5" aria-hidden="true" />
          </a>
        </section>

        <section
          v-show="tab === 'signup'"
          id="panel-signup"
          role="tabpanel"
          aria-labelledby="tab-signup"
          class="tw:flex tw:flex-col tw:gap-5"
        >
          <p v-if="state.kind === 'none'">{{ $t('events.page.state.none') }}</p>
          <dl v-else class="tw:grid tw:gap-4 tw:sm:grid-cols-2">
            <div>
              <dt class="tw:text-sm tw:text-muted-foreground">
                {{ $t('events.page.window.opens') }}
              </dt>
              <dd class="tw:font-semibold">
                {{ windowText(event.registration?.start) }}
              </dd>
            </div>
            <div>
              <dt class="tw:text-sm tw:text-muted-foreground">
                {{ $t('events.page.window.closes') }}
              </dt>
              <dd class="tw:font-semibold">
                {{ windowText(event.registration?.end) }}
              </dd>
            </div>
            <div v-if="requirements?.years?.length" class="tw:sm:col-span-2">
              <dt class="tw:text-sm tw:text-muted-foreground">
                {{ $t('events.page.years') }}
              </dt>
              <dd class="tw:mt-1 tw:flex tw:flex-wrap tw:gap-2">
                <span
                  v-for="year in requirements.years"
                  :key="year"
                  class="tw:rounded-md tw:border tw:bg-card tw:px-2.5 tw:pt-0.5 tw:text-sm tw:font-semibold"
                >
                  {{ $t('company.admin.year', { n: year }) }}
                </span>
              </dd>
            </div>
            <div
              v-if="requirements?.programmes?.length"
              class="tw:sm:col-span-2"
            >
              <dt class="tw:text-sm tw:text-muted-foreground">
                {{ $t('events.page.programmes') }}
              </dt>
              <dd class="tw:mt-1">
                <ul class="tw:flex tw:flex-col tw:gap-1">
                  <li
                    v-for="programme in requirements.programmes"
                    :key="programme"
                  >
                    {{ programme }}
                  </li>
                </ul>
              </dd>
            </div>
          </dl>
          <p class="tw:text-sm tw:text-muted-foreground">
            {{ $t('events.page.privacy') }}
          </p>
        </section>

        <section
          v-show="tab === 'company'"
          id="panel-company"
          role="tabpanel"
          aria-labelledby="tab-company"
          class="tw:flex tw:flex-col tw:gap-4"
        >
          <ul
            v-if="companyJobs.length"
            class="tw:divide-y tw:divide-border tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
          >
            <li v-for="job in companyJobs" :key="job.uid">
              <NuxtLink
                :to="localePath(`/jobs/${job.uid}`)"
                class="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:px-4 tw:py-3 tw:hover:bg-accent/60"
              >
                <span class="tw:font-semibold">{{ job.title }}</span>
                <span
                  class="tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:text-sm"
                >
                  <template v-if="job.state.kind === 'open'">
                    {{ formatDeadline(job.deadline ?? undefined, locale) }}
                  </template>
                  <DeadlineNote :state="job.state" />
                </span>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="tw:text-muted-foreground">
            {{ $t('events.page.no_jobs') }}
          </p>
          <a
            v-if="company?.webpage"
            :href="company.webpage"
            target="_blank"
            rel="noopener noreferrer"
            class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4"
          >
            {{ $t('events.page.website', { company: company.name }) }}
            <ExternalLink class="tw:size-3.5" aria-hidden="true" />
          </a>
        </section>
      </article>
    </div>

    <div
      v-else
      class="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:items-start tw:gap-4 tw:px-4 tw:py-16 tw:lg:px-8"
    >
      <h1 class="tw:text-2xl tw:font-bold">{{ $t('events.page.missing') }}</h1>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/programme')">{{
          $t('events.page.back')
        }}</NuxtLink>
      </Button>
    </div>
  </div>
</template>
