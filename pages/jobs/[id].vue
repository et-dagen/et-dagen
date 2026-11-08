<script setup lang="ts">
  import { ExternalLink, Pencil } from '@lucide/vue'
  import { useCompanies } from '@/composables/useCompanies'
  import { useDeadlineLabel } from '@/composables/useDeadlineLabel'
  import FairEvents from '@/components/job/FairEvents.vue'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardTitle } from '@/components/ui/card'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/events'
  import { deadlineState, fairEventsOf, type StoredJob } from '@/lib/jobs'
  import { useAuthStore } from '@/stores/authStore'

  const auth = useAuthStore()
  const deadlineLabel = useDeadlineLabel()
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
  const fair = computed(() =>
    fairEventsOf(job.value?.companyUID, events.value, now),
  )
  const isLink = computed(() => job.value?.listing === 'link')
  // a passed deadline takes the way to apply away, so nobody sends one too late
  const canApply = computed(
    () => !!job.value?.applicationLink && deadline.value.kind !== 'passed',
  )
  const canEdit = computed(() => auth.can('job', 'update', undefined))

  useHead(() => ({ title: job.value?.title }))

  const cardClass =
    'tw:gap-0 tw:rounded-lg tw:border-0 tw:py-0 tw:shadow-md tw:self-start'
  const titleClass =
    'tw:px-4 tw:py-2 tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]'
  const textClass = 'tw:px-4 tw:text-sm tw:leading-5 tw:tracking-[0.0178em]'
</script>

<template>
  <div
    v-if="job"
    class="tw:mx-auto tw:grid tw:w-screen tw:max-w-[420px] tw:grid-cols-1 tw:gap-4 tw:p-4 tw:[grid-template-areas:'image'_'details'_'attendants'_'description'] tw:min-[960px]:max-w-[750px] tw:min-[1280px]:max-w-[1080px] tw:min-[1280px]:grid-cols-[1fr_3fr] tw:min-[1280px]:[grid-template-areas:'details_image'_'attendants_description']"
  >
    <div
      class="tw:flex tw:max-h-[300px] tw:items-center tw:justify-center tw:rounded-lg tw:bg-white tw:p-4 tw:[grid-area:image]"
    >
      <img
        class="tw:max-h-full tw:max-w-full tw:object-contain"
        :src="company?.logo || '/images/logo_long.png'"
        :alt="company?.name ?? 'E&T-dagene'"
      />
    </div>

    <Card :class="[cardClass, 'tw:[grid-area:description]']">
      <CardTitle :class="titleClass">{{ job.title }}</CardTitle>
      <CardContent
        v-if="isLink"
        :class="[textClass, job.description ? 'tw:pb-0' : 'tw:pb-4']"
      >
        {{ $t('jobs.link_listing', { company: company?.name }) }}
      </CardContent>
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="job.description"
        :class="[
          textClass,
          'job-description tw:px-4 tw:pb-4 tw:whitespace-pre-line',
          isLink && 'tw:pt-4',
        ]"
        v-html="job.description"
      />
      <!-- eslint-enable -->
    </Card>

    <Card :class="[cardClass, 'tw:relative tw:[grid-area:details]']">
      <Button
        v-if="canEdit"
        as-child
        variant="ghost"
        size="icon-sm"
        class="tw:absolute tw:top-2 tw:right-2 tw:rounded-full tw:text-brand tw:hover:text-brand"
      >
        <NuxtLink
          :to="localePath(`/admin/jobs/${uid}`)"
          :aria-label="$t('admin.jobs.actions.edit')"
        >
          <Pencil />
        </NuxtLink>
      </Button>

      <CardTitle :class="titleClass">{{ $t('jobs.details') }}</CardTitle>

      <CardContent :class="[textClass, 'tw:py-5']">
        <strong>{{ $t('jobs.deadline') }}:</strong>
        {{ deadlineLabel(deadline, job.deadline) }}
        <span v-if="deadline.kind === 'passed'" class="tw:text-[#cc3000]">
          ({{ $t('jobs.detail.passed') }})
        </span>
      </CardContent>

      <CardContent v-if="job.jobType" :class="[textClass, 'tw:pb-5']">
        <strong>{{ $t('jobs.type') }}:</strong>
        {{
          $t(`admin.jobs.attributes.jobtype.${job.jobType.replace('-', '_')}`)
        }}
      </CardContent>

      <CardContent :class="[textClass, 'tw:pb-5']">
        <strong>{{ $t('jobs.location') }}:</strong>
        {{ job.location }}
      </CardContent>

      <CardContent :class="[textClass, 'tw:pb-5']">
        <strong>{{ $t('jobs.company') }}: </strong>
        <a
          v-if="company?.webpage"
          :href="company.webpage"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ company.name }}
          <ExternalLink
            class="tw:inline tw:size-3 tw:align-[-1px] tw:text-brand"
          />
        </a>
        <span v-else>{{ company?.name ?? 'E&T-dagene' }}</span>
      </CardContent>
    </Card>

    <div class="tw:flex tw:flex-col tw:gap-4 tw:[grid-area:attendants]">
      <Button
        v-if="canApply"
        as-child
        class="tw:h-11 tw:w-full tw:rounded tw:bg-brand tw:px-6 tw:text-lg tw:tracking-[0.0892em] tw:text-white tw:shadow-md tw:hover:bg-brand/90"
      >
        <a
          :href="job.applicationLink"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ $t('jobs.apply') }}!
        </a>
      </Button>
      <FairEvents
        v-if="fair.length"
        :company="company?.name ?? ''"
        :events="fair"
        :deadline="job.deadline"
      />
    </div>
  </div>

  <h4
    v-else
    class="tw:my-10 tw:text-center tw:text-[2.125rem] tw:leading-[1.175] tw:font-bold tw:tracking-[0.0073em]"
  >
    {{ $t('jobs.detail.missing') }}
  </h4>
</template>

<style scoped>
  .job-description :deep(ul) {
    list-style: disc;
  }

  .job-description :deep(ol) {
    list-style: decimal;
  }

  .job-description :deep(li) {
    list-style-position: inside;

    p {
      display: inline;
    }
  }

  .job-description :deep(h5) {
    font-size: 1.15rem;
  }

  .job-description :deep(h6) {
    font-size: 1.05rem;
  }
</style>
