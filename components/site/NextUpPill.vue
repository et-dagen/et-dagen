<script setup lang="ts">
  import { placeOf } from '@/lib/admin/events'
  import type { NextUp } from '@/lib/site/nextUp'

  const props = defineProps<{ next: NextUp; large?: boolean }>()

  const { locale, t } = useI18n()
  const localePath = useLocalePath()

  const time = computed(() => {
    const start = props.next.event.date?.start ?? ''
    const hhmm = start.split('T')[1]?.slice(0, 5) ?? ''
    if (props.next.when === 'today') return hhmm
    const day = new Intl.DateTimeFormat(
      locale.value,
      props.next.when === 'week'
        ? { weekday: 'short', timeZone: 'UTC' }
        : { day: 'numeric', month: 'short', timeZone: 'UTC' },
    ).format(new Date(`${start.slice(0, 10)}T12:00:00Z`))
    return `${day} ${hhmm}`
  })
  const heading = computed(() =>
    t(
      `site.next.${props.next.kind === 'next' && props.next.mine ? 'mine' : props.next.kind}`,
    ),
  )
  const room = computed(() => placeOf(props.next.event.location?.name).code)
  // the compact pill hides the title, so the link always says all of it
  const label = computed(() =>
    [`${heading.value} ${time.value}`, props.next.event.title, room.value]
      .filter(Boolean)
      .join(', '),
  )
</script>

<template>
  <NuxtLink
    :to="localePath(`/event/${next.uid}`)"
    :aria-label="label"
    class="tw:flex tw:min-w-0 tw:gap-2 tw:border tw:bg-background tw:transition-colors tw:hover:border-plate/40"
    :class="
      large
        ? 'tw:flex-wrap tw:items-center tw:rounded-xl tw:px-4 tw:py-3 tw:text-base'
        : 'tw:items-center tw:rounded-full tw:py-1.5 tw:pr-3 tw:pl-2.5 tw:text-sm'
    "
  >
    <span
      class="tw:size-2 tw:shrink-0 tw:rounded-full tw:bg-brand"
      :class="next.kind === 'now' && 'tw:motion-safe:animate-pulse'"
      aria-hidden="true"
    />
    <span class="tw:shrink-0 tw:font-bold tw:tabular-nums">
      {{ heading }} {{ time }}
    </span>
    <!-- between lg and xl the bar has room for the time and the room, not the title -->
    <span
      :class="
        large
          ? 'tw:order-last tw:basis-full'
          : 'tw:min-w-0 tw:truncate tw:max-xl:hidden'
      "
    >
      {{ next.event.title }}
    </span>
    <span
      v-if="room"
      class="tw:shrink-0 tw:rounded-sm tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:text-plate-foreground"
    >
      {{ room }}
    </span>
  </NuxtLink>
</template>
