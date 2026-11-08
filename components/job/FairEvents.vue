<script setup lang="ts">
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
  <VCard class="elevation-4" rounded="lg">
    <VCardTitle class="text-wrap">
      {{ $t('jobs.detail.meet', { company }) }}
    </VCardTitle>
    <VList class="py-0">
      <VListItem
        v-for="event in events"
        :key="event.uid"
        :to="localePath(`/event/${event.uid}`)"
        append-icon="mdi-chevron-right"
      >
        <VListItemTitle class="text-wrap">{{ event.title }}</VListItemTitle>
        <VListItemSubtitle>{{ whenAndWhere(event) }}</VListItemSubtitle>
        <VListItemSubtitle
          :class="{ 'font-weight-bold': statusOf(event) === 'open' }"
        >
          {{ $t(`jobs.detail.event_status.${statusOf(event)}`) }}
        </VListItemSubtitle>
        <VListItemSubtitle v-if="isLate(event)">
          {{ $t('jobs.detail.after_deadline') }}
        </VListItemSubtitle>
      </VListItem>
    </VList>
  </VCard>
</template>
