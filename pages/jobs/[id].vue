<script setup lang="ts">
  import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarClock,
    ExternalLink,
    MapPin,
  } from '@lucide/vue'
  import { useCompanies } from '@/composables/useCompanies'
  import CompanyLogo from '@/components/common/CompanyLogo.vue'
  import DeadlineNote from '@/components/common/DeadlineNote.vue'
  import FairEvents from '@/components/job/FairEvents.vue'
  import { Button } from '@/components/ui/button'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/events'
  import {
    deadlineState,
    fairEventsOf,
    formatDeadline,
    type StoredJob,
  } from '@/lib/jobs'

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const uid = String(useRoute().params.id)

  const [{ data: jobs }, { data: companies }, { data: events }] =
    await Promise.all([
      useFetch<Record<string, StoredJob>>('/api/v1/job', {
        query: { jobUID: uid },
      }),
      useCompanies(),
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
  <div class="et-ui pb-24 lg:pb-0">
    <div
      v-if="job"
      class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 lg:px-8 lg:py-12"
    >
      <header class="flex flex-col gap-5 lg:col-span-2">
        <NuxtLink
          :to="localePath('/jobs')"
          class="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft class="size-4" aria-hidden="true" />
          {{ $t('jobs.detail.all') }}
        </NuxtLink>
        <div class="flex items-center gap-3">
          <CompanyLogo :src="company?.logo" :name="company?.name" size="lg" />
          <a
            v-if="company?.webpage"
            :href="company.webpage"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold underline decoration-border underline-offset-4 hover:decoration-current"
          >
            {{ company.name }}
          </a>
          <span v-else class="font-semibold">{{ company?.name }}</span>
        </div>
        <h1
          class="max-w-4xl text-3xl leading-tight font-extrabold tracking-tight text-balance lg:text-[2.75rem]"
        >
          {{ job.title }}
        </h1>
        <dl class="flex flex-wrap gap-x-8 gap-y-3 border-t pt-5">
          <div v-if="job.jobType" class="flex items-center gap-2">
            <dt>
              <BriefcaseBusiness
                class="size-4 text-muted-foreground"
                :aria-label="$t('jobs.type')"
              />
            </dt>
            <dd class="font-medium">
              {{
                $t(
                  `admin.jobs.attributes.jobtype.${job.jobType.replace('-', '_')}`,
                )
              }}
            </dd>
          </div>
          <div v-if="job.location" class="flex items-center gap-2">
            <dt>
              <MapPin
                class="size-4 text-muted-foreground"
                :aria-label="$t('jobs.location')"
              />
            </dt>
            <dd class="font-medium">{{ job.location }}</dd>
          </div>
          <div
            v-if="deadline.kind !== 'none'"
            class="flex flex-wrap items-center gap-2 lg:hidden"
          >
            <dt>
              <CalendarClock
                class="size-4 text-muted-foreground"
                :aria-label="$t('jobs.deadline')"
              />
            </dt>
            <dd class="font-medium">
              <template v-if="dated">
                {{ formatDeadline(job.deadline ?? undefined, locale) }}
              </template>
            </dd>
            <dd><DeadlineNote :state="deadline" /></dd>
          </div>
        </dl>
      </header>

      <article class="flex min-w-0 flex-col gap-6">
        <p
          v-if="isLink"
          class="rounded-lg border bg-card p-4 text-muted-foreground"
        >
          {{ $t('jobs.link_listing', { company: company?.name }) }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="job.description" class="et-prose" v-html="job.description" />
      </article>

      <aside class="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
        <div
          class="hidden flex-col gap-4 rounded-lg border bg-card p-5 lg:flex"
        >
          <div>
            <p class="text-sm text-muted-foreground">
              {{ $t('jobs.deadline') }}
            </p>
            <p class="text-xl font-bold">
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
          <Button v-if="canApply" as-child size="lg" class="w-full">
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
      class="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16 lg:px-8"
    >
      <h1 class="text-2xl font-bold">{{ $t('jobs.detail.missing') }}</h1>
      <Button as-child variant="outline">
        <NuxtLink :to="localePath('/jobs')">{{
          $t('jobs.detail.all')
        }}</NuxtLink>
      </Button>
    </div>

    <!-- on phones the way to apply stays in reach while reading -->
    <div
      v-if="job && canApply"
      class="fixed inset-x-0 bottom-0 z-10 border-t bg-card px-4 py-3 shadow-[0_-4px_16px_rgb(28_29_33/0.08)] lg:hidden"
    >
      <Button as-child size="lg" class="w-full">
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
