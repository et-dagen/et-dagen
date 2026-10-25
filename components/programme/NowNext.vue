<script setup lang="ts">
  import { placeOf } from '@/lib/admin/events'
  import type { ProgrammeEvent } from '@/lib/programme'

  const props = defineProps<{
    now: ProgrammeEvent[]
    next: ProgrammeEvent | null
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()

  // the countdown moves each minute
  const clock = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(
    () => (timer = setInterval(() => (clock.value = Date.now()), 30_000)),
  )
  onBeforeUnmount(() => clearInterval(timer))

  const hhmm = (value: string | undefined) =>
    value?.split('T')[1]?.slice(0, 5) ?? ''
  const startsIn = computed(() => {
    const start = props.next?.date?.start
    if (!start) return ''
    // stored times are Oslo wall-clock; Date.parse reads them in the browser's zone, which is
    // Oslo for nearly every visitor during the fair
    const minutes = Math.max(
      0,
      Math.round((Date.parse(start) - clock.value) / 60_000),
    )
    const days = Math.floor(minutes / 1440)
    if (days > 0) return t('programme.band.in_days', days)
    const hours = Math.floor(minutes / 60)
    return hours > 0
      ? t('programme.band.in_hours', { hours, minutes: minutes % 60 })
      : t('programme.band.in_minutes', minutes % 60)
  })
</script>

<template>
  <section
    v-if="now.length || next"
    class="tw:grid tw:overflow-hidden tw:rounded-lg tw:text-white tw:sm:grid-cols-2"
    :aria-label="$t('programme.band.label')"
  >
    <div
      v-if="now.length"
      class="tw:flex tw:flex-col tw:gap-1 tw:bg-plate tw:p-5"
    >
      <p class="tw:text-sm tw:font-semibold tw:opacity-80">
        {{ $t('programme.band.now') }}
      </p>
      <NuxtLink
        v-for="event in now"
        :key="event.uid"
        :to="localePath(`/event/${event.uid}`)"
        class="tw:text-xl tw:leading-snug tw:font-extrabold tw:hover:underline"
      >
        {{ event.title }}
      </NuxtLink>
      <p
        class="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:text-sm tw:opacity-95"
      >
        <span>{{
          $t('programme.band.until', { time: hhmm(now[0]?.date?.end) })
        }}</span>
        <span
          v-if="placeOf(now[0]?.location?.name).code"
          class="tw:rounded-sm tw:bg-white tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:text-plate"
        >
          {{ placeOf(now[0]?.location?.name).code }}
        </span>
        <span v-else-if="now[0]?.location?.name">{{
          now[0].location.name
        }}</span>
      </p>
    </div>
    <div
      v-if="next"
      class="tw:flex tw:flex-col tw:gap-1 tw:bg-brand tw:p-5"
      :class="!now.length && 'tw:sm:col-span-2'"
    >
      <p class="tw:text-sm tw:font-semibold tw:opacity-80">
        {{ $t('programme.band.next') }}
      </p>
      <NuxtLink
        :to="localePath(`/event/${next.uid}`)"
        class="tw:text-xl tw:leading-snug tw:font-extrabold tw:hover:underline"
      >
        {{ next.title }}
      </NuxtLink>
      <p
        class="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:text-sm tw:opacity-95"
      >
        <span class="tw:font-semibold tw:tabular-nums">{{
          hhmm(next.date?.start)
        }}</span>
        <span>{{ startsIn }}</span>
        <span
          v-if="placeOf(next.location?.name).code"
          class="tw:rounded-sm tw:bg-white tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:text-plate"
        >
          {{ placeOf(next.location?.name).code }}
        </span>
      </p>
    </div>
  </section>
</template>
