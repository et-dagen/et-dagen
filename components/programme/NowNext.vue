<script setup lang="ts">
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
  <VContainer v-if="now.length || next" class="d-flex justify-center">
    <VCard
      tag="section"
      elevation="2"
      variant="flat"
      class="now-next"
      :aria-label="$t('programme.band.label')"
    >
      <VCardText>
        <div v-for="event in now" :key="event.uid" class="now-next__row">
          <VIcon color="primary">mdi-play-circle</VIcon>
          <span>
            <span class="bold">{{ $t('programme.band.now') }}:</span>
            <NuxtLink
              :to="localePath(`/event/${event.uid}`)"
              class="now-next__link text-primary"
            >
              {{ event.title }}
            </NuxtLink>
            <span>
              {{ $t('programme.band.until', { time: hhmm(event.date?.end) }) }}
            </span>
            <span v-if="event.location?.name">
              · {{ event.location.name }}
            </span>
          </span>
        </div>
        <div v-if="next" class="now-next__row">
          <VIcon color="primary">mdi-clock</VIcon>
          <span>
            <span class="bold">{{ $t('programme.band.next') }}:</span>
            <NuxtLink
              :to="localePath(`/event/${next.uid}`)"
              class="now-next__link text-primary"
            >
              {{ next.title }}
            </NuxtLink>
            <span>{{ hhmm(next.date?.start) }}, {{ startsIn }}</span>
            <span v-if="next.location?.name"> · {{ next.location.name }} </span>
          </span>
        </div>
      </VCardText>
    </VCard>
  </VContainer>
</template>

<style scoped lang="scss">
  .now-next {
    width: 600px;
    max-width: 100%;

    &__row {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;

      & + & {
        margin-top: 0.5rem;
      }
    }

    &__link {
      font-weight: bold;
      margin-right: 0.25rem;
    }
  }

  .bold {
    font-weight: bold;
    margin-right: 0.25rem;
  }
</style>
