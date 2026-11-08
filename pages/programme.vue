<script setup lang="ts">
  import NowNext from '@/components/programme/NowNext.vue'
  import Timeline from '@/components/programme/Timeline.vue'
  import { useCompanies } from '@/composables/useCompanies'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/events'
  import { nowAndNext, programmeDays, standMapsByDay } from '@/lib/programme'
  import { osloDay } from '@/lib/time'

  defineOptions({ name: 'Programme' })

  const { t } = useI18n()

  const [{ data: events }, { data: companies }, { data: maps }] =
    await Promise.all([
      useFetch<Record<string, EventRow>>('/api/v1/event'),
      useCompanies(),
      useFetch<{ date: string; url: string }[]>('/api/v1/image/standmap'),
    ])

  const days = computed(() => programmeDays(events.value))
  const standMaps = computed(() => standMapsByDay(maps.value))
  // the card is for the fair itself, so the next event shows only when it starts today
  const band = computed(() => {
    const now = Instant.now()
    const { now: running, next } = nowAndNext(days.value, now)
    const today = next?.date?.start?.slice(0, 10) === osloDay(now)
    return { now: running, next: today ? next : null }
  })

  useHead({ title: () => t('program.title') })
</script>

<template>
  <div class="container">
    <h4 class="text-center pt-4 pb-7">{{ $t('program.title') }}</h4>
    <!-- now and next depend on the clock, so they draw in the browser -->
    <ClientOnly>
      <NowNext :now="band.now" :next="band.next" />
    </ClientOnly>
    <Timeline :days="days" :maps="standMaps" :companies="companies" />
  </div>
</template>

<style scoped>
  .container {
    max-width: 95vw;
    margin: 0 auto;
  }
</style>
