<script setup lang="ts">
  import { ChevronRight, MapPin } from '@lucide/vue'
  import { Instant } from '@/domain/time'
  import { eventStatus, formatStart, placeOf } from '@/lib/admin/events'
  import { afterDeadline, type FairEvent } from '@/lib/jobs'

  const props = defineProps<{
    company: string
    events: FairEvent[]
    deadline?: string | null
  }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const now = Instant.now()
  const statusOf = (event: FairEvent) => eventStatus(event, now).kind
  const isLate = (event: FairEvent) => afterDeadline(event, props.deadline)
</script>

<template>
  <section class="tw:flex tw:flex-col tw:gap-3" aria-labelledby="fair-heading">
    <h2 id="fair-heading" class="tw:text-lg tw:font-bold">
      {{ $t('jobs.detail.meet', { company }) }}
    </h2>
    <ul
      class="tw:divide-y tw:overflow-hidden tw:rounded-lg tw:border tw:bg-card"
    >
      <li v-for="event in events" :key="event.uid">
        <NuxtLink
          :to="localePath(`/event/${event.uid}`)"
          class="tw:group tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3 tw:hover:bg-accent"
        >
          <span
            v-if="placeOf(event.location?.name).code"
            class="tw:min-w-12 tw:rounded-sm tw:bg-plate tw:px-1.5 tw:pt-1 tw:pb-0.5 tw:text-center tw:text-sm tw:font-extrabold tw:text-plate-foreground"
          >
            {{ placeOf(event.location?.name).code }}
          </span>
          <span
            v-else
            class="tw:grid tw:min-w-12 tw:place-items-center tw:text-muted-foreground"
          >
            <MapPin class="tw:size-5" aria-hidden="true" />
          </span>
          <span class="tw:min-w-0 tw:flex-1">
            <span class="tw:block tw:font-semibold tw:group-hover:underline">
              {{ event.title }}
            </span>
            <span class="tw:block tw:text-sm tw:text-muted-foreground">
              {{ formatStart(event, locale) }}
            </span>
            <span
              class="tw:block tw:text-sm"
              :class="
                statusOf(event) === 'open'
                  ? 'tw:font-semibold'
                  : 'tw:text-muted-foreground'
              "
            >
              {{ $t(`jobs.detail.event_status.${statusOf(event)}`) }}
            </span>
            <span
              v-if="isLate(event)"
              class="tw:block tw:text-sm tw:font-semibold tw:text-muted-foreground"
            >
              {{ $t('jobs.detail.after_deadline') }}
            </span>
          </span>
          <ChevronRight
            class="tw:size-4 tw:shrink-0 tw:text-muted-foreground"
            aria-hidden="true"
          />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
