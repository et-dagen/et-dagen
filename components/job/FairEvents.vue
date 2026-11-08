<script setup lang="ts">
  import { ChevronRight } from '@lucide/vue'
  import { Card, CardTitle } from '@/components/ui/card'
  import { Instant } from '@/domain/time'
  import { eventStatus, formatStart } from '@/lib/events'
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
  const whenAndWhere = (event: FairEvent) =>
    [formatStart(event, locale.value), event.location?.name]
      .filter(Boolean)
      .join(' · ')
</script>

<template>
  <Card
    class="tw:gap-0 tw:overflow-hidden tw:rounded-lg tw:border-0 tw:py-0 tw:shadow-md"
  >
    <CardTitle
      class="tw:px-4 tw:py-2 tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
    >
      {{ $t('jobs.detail.meet', { company }) }}
    </CardTitle>
    <ul>
      <li v-for="event in events" :key="event.uid">
        <NuxtLink
          :to="localePath(`/event/${event.uid}`)"
          class="tw:flex tw:min-h-16 tw:items-center tw:gap-4 tw:px-4 tw:py-2 tw:transition-colors tw:hover:bg-black/4"
        >
          <div class="tw:min-w-0 tw:flex-1">
            <div class="tw:text-base tw:leading-6 tw:tracking-[0.009em]">
              {{ event.title }}
            </div>
            <div
              class="tw:text-sm tw:leading-5 tw:tracking-[0.0178em] tw:opacity-60"
            >
              <div>{{ whenAndWhere(event) }}</div>
              <div :class="{ 'tw:font-bold': statusOf(event) === 'open' }">
                {{ $t(`jobs.detail.event_status.${statusOf(event)}`) }}
              </div>
              <div v-if="isLate(event)">
                {{ $t('jobs.detail.after_deadline') }}
              </div>
            </div>
          </div>
          <ChevronRight class="tw:size-6 tw:shrink-0 tw:opacity-60" />
        </NuxtLink>
      </li>
    </ul>
  </Card>
</template>
