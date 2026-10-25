<script setup lang="ts">
  import { placeOf } from '@/lib/admin/events'
  import type { NextUp } from '@/lib/site/nextUp'

  const props = defineProps<{ next: NextUp; large?: boolean }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()

  const time = computed(() => {
    const start = props.next.event.date?.start ?? ''
    const hhmm = start.split('T')[1]?.slice(0, 5) ?? ''
    if (props.next.kind === 'now' || props.next.today) return hhmm
    const weekday = new Intl.DateTimeFormat(locale.value, {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${start.slice(0, 10)}T12:00:00Z`))
    return `${weekday} ${hhmm}`
  })
  const room = computed(() => placeOf(props.next.event.location?.name).code)
</script>

<template>
  <NuxtLink
    :to="localePath(`/event/${next.uid}`)"
    class="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:bg-background tw:text-sm tw:transition-colors tw:hover:border-plate/40"
    :class="
      large ? 'tw:px-4 tw:py-3 tw:text-base' : 'tw:py-1.5 tw:pr-3 tw:pl-2.5'
    "
  >
    <span
      class="tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-brand"
      :class="next.kind === 'now' && 'tw:motion-safe:animate-pulse'"
      aria-hidden="true"
    />
    <span class="tw:shrink-0 tw:font-bold tw:tabular-nums">
      {{ $t(`site.next.${next.kind}`) }} {{ time }}
    </span>
    <span class="tw:min-w-0 tw:truncate">{{ next.event.title }}</span>
    <span
      v-if="room"
      class="tw:shrink-0 tw:rounded-sm tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:text-plate-foreground"
    >
      {{ room }}
    </span>
  </NuxtLink>
</template>
