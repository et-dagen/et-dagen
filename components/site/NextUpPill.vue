<script setup lang="ts">
  import { placeOf } from '@/lib/events'
  import type { NextUp } from '@/lib/site/nextUp'
  import { formatDay } from '@/lib/time'

  const props = defineProps<{ next: NextUp; large?: boolean }>()

  const { locale, t } = useI18n()
  const localePath = useLocalePath()

  const time = computed(() => {
    const start = props.next.event.date?.start ?? ''
    const hhmm = start.split('T')[1]?.slice(0, 5) ?? ''
    if (props.next.when === 'today') return hhmm
    const day = formatDay(
      start.slice(0, 10),
      locale.value,
      props.next.when === 'week'
        ? { weekday: 'short' }
        : { day: 'numeric', month: 'short' },
    )
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
    class="flex min-w-0 gap-2 border bg-background transition-colors hover:border-plate/40"
    :class="
      large
        ? 'flex-wrap items-center rounded-xl px-4 py-3 text-base'
        : 'items-center rounded-full py-1.5 pr-3 pl-2.5 text-sm'
    "
  >
    <span
      class="size-2 shrink-0 rounded-full bg-brand"
      :class="next.kind === 'now' && 'motion-safe:animate-pulse'"
      aria-hidden="true"
    />
    <span class="shrink-0 font-bold tabular-nums">
      {{ heading }} {{ time }}
    </span>
    <!-- between lg and xl the bar has room for the time and the room, not the title -->
    <span
      :class="
        large ? 'order-last basis-full' : 'min-w-0 truncate max-xl:hidden'
      "
    >
      {{ next.event.title }}
    </span>
    <span
      v-if="room"
      class="shrink-0 rounded-sm bg-plate px-1.5 pt-0.5 text-xs font-extrabold text-plate-foreground"
    >
      {{ room }}
    </span>
  </NuxtLink>
</template>
