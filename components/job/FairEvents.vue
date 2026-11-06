<script setup lang="ts">
  import { ChevronRight, MapPin } from '@lucide/vue'
  import { Instant } from '@/domain/time'
  import { eventStatus, formatStart, placeOf } from '@/lib/events'
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
  <section class="flex flex-col gap-3" aria-labelledby="fair-heading">
    <h2 id="fair-heading" class="text-lg font-bold">
      {{ $t('jobs.detail.meet', { company }) }}
    </h2>
    <ul class="divide-y overflow-hidden rounded-lg border bg-card">
      <li v-for="event in events" :key="event.uid">
        <NuxtLink
          :to="localePath(`/event/${event.uid}`)"
          class="group flex items-center gap-3 px-4 py-3 hover:bg-accent"
        >
          <span
            v-if="placeOf(event.location?.name).code"
            class="min-w-12 rounded-sm bg-plate px-1.5 pt-1 pb-0.5 text-center text-sm font-extrabold text-plate-foreground"
          >
            {{ placeOf(event.location?.name).code }}
          </span>
          <span
            v-else
            class="grid min-w-12 place-items-center text-muted-foreground"
          >
            <MapPin class="size-5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-semibold group-hover:underline">
              {{ event.title }}
            </span>
            <span class="block text-sm text-muted-foreground">
              {{ formatStart(event, locale) }}
            </span>
            <span
              class="block text-sm"
              :class="
                statusOf(event) === 'open'
                  ? 'font-semibold'
                  : 'text-muted-foreground'
              "
            >
              {{ $t(`jobs.detail.event_status.${statusOf(event)}`) }}
            </span>
            <span
              v-if="isLate(event)"
              class="block text-sm font-semibold text-muted-foreground"
            >
              {{ $t('jobs.detail.after_deadline') }}
            </span>
          </span>
          <ChevronRight
            class="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
