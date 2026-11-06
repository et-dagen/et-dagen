<script setup lang="ts">
  import { placeOf } from '@/lib/events'
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
    class="grid overflow-hidden rounded-lg text-white sm:grid-cols-2"
    :aria-label="$t('programme.band.label')"
  >
    <div v-if="now.length" class="flex flex-col gap-1 bg-plate p-5">
      <p class="text-sm font-semibold opacity-80">
        {{ $t('programme.band.now') }}
      </p>
      <NuxtLink
        v-for="event in now"
        :key="event.uid"
        :to="localePath(`/event/${event.uid}`)"
        class="text-xl leading-snug font-extrabold hover:underline"
      >
        {{ event.title }}
      </NuxtLink>
      <p class="flex flex-wrap items-center gap-x-2 text-sm opacity-95">
        <span>{{
          $t('programme.band.until', { time: hhmm(now[0]?.date?.end) })
        }}</span>
        <span
          v-if="placeOf(now[0]?.location?.name).code"
          class="rounded-sm bg-white px-1.5 pt-0.5 text-xs font-extrabold text-plate"
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
      class="flex flex-col gap-1 bg-brand p-5"
      :class="!now.length && 'sm:col-span-2'"
    >
      <p class="text-sm font-semibold opacity-80">
        {{ $t('programme.band.next') }}
      </p>
      <NuxtLink
        :to="localePath(`/event/${next.uid}`)"
        class="text-xl leading-snug font-extrabold hover:underline"
      >
        {{ next.title }}
      </NuxtLink>
      <p class="flex flex-wrap items-center gap-x-2 text-sm opacity-95">
        <span class="font-semibold tabular-nums">{{
          hhmm(next.date?.start)
        }}</span>
        <span>{{ startsIn }}</span>
        <span
          v-if="placeOf(next.location?.name).code"
          class="rounded-sm bg-white px-1.5 pt-0.5 text-xs font-extrabold text-plate"
        >
          {{ placeOf(next.location?.name).code }}
        </span>
      </p>
    </div>
  </section>
</template>
