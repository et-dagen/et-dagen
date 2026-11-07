<script setup lang="ts">
  import { useCompanies } from '@/composables/useCompanies'
  import { useDeadlineLabel } from '@/composables/useDeadlineLabel'
  import FairEvents from '@/components/job/FairEvents.vue'
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
</script>

<template>
  <VContainer v-if="job" class="container">
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

    <!-- job description -->
    <VCard class="description elevation-4" rounded="lg">
      <VCardTitle class="description__title">{{ job.title }}</VCardTitle>
      <VCardText v-if="isLink" :class="{ 'pb-0': job.description }">
        {{ $t('jobs.link_listing', { company: company?.name }) }}
      </VCardText>
      <!-- eslint-disable vue/no-v-text-v-html-on-component vue/no-v-html -->
      <VCardText
        v-if="job.description"
        class="description__text"
        v-html="job.description"
      />
      <!-- eslint-enable -->
    </VCard>

    <!-- job details -->
    <VCard class="details elevation-4" rounded="lg">
      <!-- edit job -->
      <VBtn
        v-if="canEdit"
        class="edit-event"
        variant="text"
        icon="mdi-pencil"
        size="small"
        color="primary"
        :to="localePath(`/admin/jobs/${uid}`)"
      />

      <VCardTitle class="details__title">
        {{ $t('jobs.details') }}
      </VCardTitle>

      <VCardText class="pt-5 pb-5">
        <strong>{{ $t('jobs.deadline') }}:</strong>
        {{ deadlineLabel(deadline, job.deadline) }}
        <span v-if="deadline.kind === 'passed'" class="text-error">
          ({{ $t('jobs.detail.passed') }})
        </span>
      </VCardText>

      <VCardText v-if="job.jobType" class="py-0 pb-5">
        <strong>{{ $t('jobs.type') }}:</strong>
        {{
          $t(`admin.jobs.attributes.jobtype.${job.jobType.replace('-', '_')}`)
        }}
      </VCardText>

      <VCardText class="py-0 pb-5">
        <strong>{{ $t('jobs.location') }}:</strong>
        {{ job.location }}
      </VCardText>

      <VCardText class="py-0 pb-5">
        <strong>{{ $t('jobs.company') }}: </strong>
        <a
          v-if="company?.webpage"
          :href="company.webpage"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ company.name }}
          <VIcon size="xsmall" color="primary">mdi-open-in-new</VIcon>
        </a>
        <span v-else>{{ company?.name ?? 'E&T-dagene' }}</span>
      </VCardText>
    </VCard>

    <!-- apply for job, and the company's events at the fair -->
    <div class="attendant-container">
      <div v-if="canApply">
        <VBtn
          color="primary"
          block
          :ripple="true"
          density="comfortable"
          :href="job.applicationLink"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ $t('jobs.apply') }}!
        </VBtn>
      </div>
      <FairEvents
        v-if="fair.length"
        :company="company?.name ?? ''"
        :events="fair"
        :deadline="job.deadline"
      />
    </div>
  </VContainer>

  <h4 v-else class="font-weight-bold text-center my-10">
    {{ $t('jobs.detail.missing') }}
  </h4>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  .container {
    display: grid;
    width: 100vw;
    grid-template-columns: 1fr 3fr;
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

    .description {
      grid-area: description;

      :deep(li) {
        list-style-position: inside;
        p {
          display: inline;
        }
      }

      :deep(h5) {
        font-size: 1.15rem;
      }

      :deep(h6) {
        font-size: 1.05rem;
      }

      &__text {
        white-space: pre-line;
      }
    }
    .details {
      grid-area: details;

      .edit-event {
        position: absolute;
        right: 0.5rem;
        top: 0.5rem;
      }
    }

    .attendant-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
</style>
