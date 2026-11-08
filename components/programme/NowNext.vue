<script setup lang="ts">
  import { CirclePlay, Clock } from '@lucide/vue'
  import { Card } from '@/components/ui/card'
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
  <div
    v-if="now.length || next"
    class="tw:mx-auto tw:flex tw:w-full tw:justify-center tw:p-4 tw:min-[960px]:max-w-[900px] tw:min-[1280px]:max-w-[1200px] tw:min-[1920px]:max-w-[1800px]"
  >
    <Card
      role="region"
      :aria-label="$t('programme.band.label')"
      class="tw:w-[600px] tw:max-w-full tw:gap-2 tw:rounded-[4px] tw:border-0 tw:p-4 tw:text-sm tw:leading-[1.425] tw:tracking-[0.0178em] tw:text-black/87 tw:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),0_2px_2px_0_rgba(0,0,0,0.14),0_1px_5px_0_rgba(0,0,0,0.12)]"
    >
      <div v-for="event in now" :key="event.uid" class="tw:flex tw:gap-2">
        <CirclePlay class="tw:size-[21px] tw:shrink-0 tw:text-brand" />
        <span>
          <span class="tw:mr-1 tw:font-bold"
            >{{ $t('programme.band.now') }}:</span
          >
          <NuxtLink
            :to="localePath(`/event/${event.uid}`)"
            class="tw:mr-1 tw:font-bold tw:text-brand"
          >
            {{ event.title }}
          </NuxtLink>
          <span>
            {{ $t('programme.band.until', { time: hhmm(event.date?.end) }) }}
          </span>
          <span v-if="event.location?.name"> · {{ event.location.name }} </span>
        </span>
      </div>
      <div v-if="next" class="tw:flex tw:gap-2">
        <Clock class="tw:size-[21px] tw:shrink-0 tw:text-brand" />
        <span>
          <span class="tw:mr-1 tw:font-bold"
            >{{ $t('programme.band.next') }}:</span
          >
          <NuxtLink
            :to="localePath(`/event/${next.uid}`)"
            class="tw:mr-1 tw:font-bold tw:text-brand"
          >
            {{ next.title }}
          </NuxtLink>
          <span>{{ hhmm(next.date?.start) }}, {{ startsIn }}</span>
          <span v-if="next.location?.name"> · {{ next.location.name }} </span>
        </span>
      </div>
    </Card>
  </div>
</template>
