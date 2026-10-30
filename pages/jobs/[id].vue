<script setup lang="ts">
  import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarClock,
    ExternalLink,
    MapPin,
  } from '@lucide/vue'
  import CompanyLogo from '@/components/common/CompanyLogo.vue'
  import DeadlineNote from '@/components/common/DeadlineNote.vue'
  import FairEvents from '@/components/job/FairEvents.vue'
  import { Button } from '@/components/ui/button'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/admin/events'
  import {
    deadlineState,
    fairEventsOf,
    formatDeadline,
    type DeadlineType,
  } from '@/lib/jobs'

  interface StoredJob {
    title?: string
    companyUID?: string
    jobType?: string
    location?: string
    deadline?: string | null
    deadlineType?: DeadlineType
    description?: string
    listing?: 'text' | 'link'
    applicationLink?: string
  }
  interface StoredCompany {
    name?: string
    logo?: string
    webpage?: string
  }

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const uid = String(useRoute().params.id)

  const [{ data: jobs }, { data: companies }, { data: events }] =
    await Promise.all([
      useFetch<Record<string, StoredJob>>('/api/v1/job', {
        query: { jobUID: uid },
      }),
      useFetch<Record<string, StoredCompany>>('/api/v1/company'),
      useFetch<Record<string, EventRow>>('/api/v1/event'),
    ])

  const job = computed(() => jobs.value?.[uid])
  const company = computed(
    () => companies.value?.[job.value?.companyUID ?? ''] ?? null,
  )
  const now = Instant.now()
  const deadline = computed(() =>
    deadlineState(job.value?.deadline, now, job.value?.deadlineType),
  )
  const dated = computed(
    () => deadline.value.kind === 'open' || deadline.value.kind === 'passed',
  )
  const fair = computed(() =>
    fairEventsOf(job.value?.companyUID, events.value, now),
  )
  const isLink = computed(() => job.value?.listing === 'link')
  // a passed deadline takes the way to apply away, so nobody sends one too late
  const canApply = computed(
    () => !!job.value?.applicationLink && deadline.value.kind !== 'passed',
  )

  useHead(() => ({ title: job.value?.title }))
</script>

<template>
  <div class="et-ui tw:pb-24 tw:lg:pb-0">
    <div
      v-if="job"
      class="tw:mx-auto tw:grid tw:max-w-6xl tw:gap-8 tw:px-4 tw:py-8 tw:lg:grid-cols-[minmax(0,1fr)_22rem] tw:lg:gap-12 tw:lg:px-8 tw:lg:py-12"
    >
      <header class="tw:flex tw:flex-col tw:gap-5 tw:lg:col-span-2">
        <NuxtLink
          :to="localePath('/jobs')"
          class="tw:inline-flex tw:w-fit tw:items-center tw:gap-1 tw:text-sm tw:text-muted-foreground tw:hover:text-foreground"
        >
          <ArrowLeft class="tw:size-4" aria-hidden="true" />
          {{ $t('jobs.detail.all') }}
        </NuxtLink>
        <div class="tw:flex tw:items-center tw:gap-3">
          <CompanyLogo :src="company?.logo" :name="company?.name" size="lg" />
          <a
            v-if="company?.webpage"
            :href="company.webpage"
            target="_blank"
            rel="noopener noreferrer"
            class="tw:font-semibold tw:underline tw:decoration-border tw:underline-offset-4 tw:hover:decoration-current"
          >
            {{ company.name }}
          </a>
          <span v-else class="tw:font-semibold">{{ company?.name }}</span>
        </div>
        <h1
          class="tw:max-w-4xl tw:text-3xl tw:leading-tight tw:font-extrabold tw:tracking-tight tw:text-balance tw:lg:text-[2.75rem]"
        >
          {{ job.title }}
        </h1>
        <dl
          class="tw:flex tw:flex-wrap tw:gap-x-8 tw:gap-y-3 tw:border-t tw:pt-5"
        >
          <div v-if="job.jobType" class="tw:flex tw:items-center tw:gap-2">
            <dt>
              <BriefcaseBusiness
                class="tw:size-4 tw:text-muted-foreground"
                :aria-label="$t('jobs.type')"
              />
            </dt>
            <dd class="tw:font-medium">
              {{
                $t(
                  `admin.jobs.attributes.jobtype.${job.jobType.replace('-', '_')}`,
                )
              }}
            </dd>
          </div>
          <div v-if="job.location" class="tw:flex tw:items-center tw:gap-2">
            <dt>
              <MapPin
                class="tw:size-4 tw:text-muted-foreground"
                :aria-label="$t('jobs.location')"
              />
            </dt>
            <dd class="tw:font-medium">{{ job.location }}</dd>
          </div>
          <div
            v-if="deadline.kind !== 'none'"
            class="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:lg:hidden"
          >
            <dt>
              <CalendarClock
                class="tw:size-4 tw:text-muted-foreground"
                :aria-label="$t('jobs.deadline')"
              />
            </dt>
            <dd class="tw:font-medium">
              <template v-if="dated">
                {{ formatDeadline(job.deadline ?? undefined, locale) }}
              </template>
            </dd>
            <dd><DeadlineNote :state="deadline" /></dd>
          </div>
        </dl>
      </header>

      <article class="tw:flex tw:min-w-0 tw:flex-col tw:gap-6">
        <p
          v-if="isLink"
          class="tw:rounded-lg tw:border tw:bg-card tw:p-4 tw:text-muted-foreground"
        >
          {{ $t('jobs.link_listing', { company: company?.name }) }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="job.description" class="et-prose" v-html="job.description" />
      </article>

      <aside
        class="tw:flex tw:flex-col tw:gap-8 tw:lg:sticky tw:lg:top-24 tw:lg:self-start"
      >
        <div
          class="tw:hidden tw:flex-col tw:gap-4 tw:rounded-lg tw:border tw:bg-card tw:p-5 tw:lg:flex"
        >
          <div>
            <p class="tw:text-sm tw:text-muted-foreground">
              {{ $t('jobs.deadline') }}
            </p>
            <p class="tw:text-xl tw:font-bold">
              {{
                dated
                  ? formatDeadline(job.deadline ?? undefined, locale)
                  : $t(
                      deadline.kind === 'asap'
                        ? 'jobs.detail.asap'
                        : 'jobs.detail.rolling',
                    )
              }}
            </p>
            <DeadlineNote v-if="dated" :state="deadline" />
          </div>
          <Button v-if="canApply" as-child size="lg" class="tw:w-full">
            <a
              :href="job.applicationLink"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ $t(isLink ? 'jobs.open_listing' : 'jobs.detail.apply') }}
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
        </div>
        <FairEvents
          v-if="fair.length"
          :company="company?.name ?? ''"
          :events="fair"
          :deadline="job.deadline"
        />
      </aside>
    </div>

    <div
      v-else
      class="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-col tw:items-start tw:gap-4 tw:px-4 tw:py-16 tw:lg:px-8"
    >
      <h1 class="tw:text-2xl tw:font-bold">{{ $t('jobs.detail.missing') }}</h1>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/jobs')">{{
          $t('jobs.detail.all')
        }}</NuxtLink>
      </Button>
    </div>

    <!-- on phones the way to apply stays in reach while reading -->
    <div
      v-if="job && canApply"
      class="tw:fixed tw:inset-x-0 tw:bottom-0 tw:z-10 tw:border-t tw:bg-card tw:px-4 tw:py-3 tw:shadow-[0_-4px_16px_rgb(28_29_33/0.08)] tw:lg:hidden"
    >
      <Button as-child size="lg" class="tw:w-full">
        <a
          :href="job.applicationLink"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ $t(isLink ? 'jobs.open_listing' : 'jobs.detail.apply') }}
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
    </div>
  </div>
</template>
