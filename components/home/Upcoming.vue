<script setup lang="ts">
  import { ArrowRight } from '@lucide/vue'
  import { eventStatus, formatStart, placeOf } from '@/lib/events'
  import { placesLeft, type Upcoming } from '@/lib/site/fair'
  import { Instant, type ISO8601Literal } from '@/domain/time'

  // unbranded: Vue checks a branded string at runtime as an object, and warns
  const props = defineProps<{ events: Upcoming[]; now: ISO8601Literal }>()
  const now = computed(() => Instant.parse(props.now))

  const { locale } = useI18n()
  const localePath = useLocalePath()

  const when = (item: Upcoming) =>
    formatStart(item.event, locale.value).replace(/,? \d{4}/, '')
</script>

<template>
  <section
    aria-labelledby="home-upcoming"
    class="mx-auto max-w-screen-2xl px-4 py-20 lg:px-8 lg:py-28"
  >
    <div class="flex flex-wrap items-end justify-between gap-4">
      <h2
        id="home-upcoming"
        class="text-3xl font-black tracking-tight lg:text-4xl"
      >
        {{ $t('home.upcoming') }}
      </h2>
      <NuxtLink
        :to="localePath('/programme')"
        class="inline-flex items-center gap-2 font-bold underline decoration-border decoration-2 underline-offset-[6px] hover:decoration-brand"
      >
        {{ $t('home.programme') }}
        <ArrowRight class="size-4" aria-hidden="true" />
      </NuxtLink>
    </div>

    <ul class="mt-10 divide-y border-y">
      <li v-for="item in events" :key="item.uid">
        <NuxtLink
          :to="localePath(`/event/${item.uid}`)"
          class="group grid gap-x-8 gap-y-1 py-5 transition-colors hover:bg-card md:grid-cols-[13rem_minmax(0,1fr)_14rem_12rem] md:items-center md:px-4"
        >
          <span class="font-semibold text-muted-foreground tabular-nums">
            {{ when(item) }}
          </span>
          <span
            class="text-lg leading-snug font-bold group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4"
          >
            {{ item.event.title }}
          </span>
          <span class="flex min-w-0 items-center gap-2 text-muted-foreground">
            <span
              v-if="placeOf(item.event.location?.name).code"
              class="rounded bg-plate px-1.5 pt-0.5 text-xs font-extrabold tracking-wide text-plate-foreground"
            >
              {{ placeOf(item.event.location?.name).code }}
            </span>
            <span class="truncate">
              {{ placeOf(item.event.location?.name).name }}
            </span>
          </span>
          <span class="text-sm text-muted-foreground md:text-right">
            <template v-if="placesLeft(item.event, now) !== null">
              {{ $t('home.places', { n: placesLeft(item.event, now) }) }}
            </template>
            <template v-else>
              {{ $t(`home.status.${eventStatus(item.event, now).kind}`) }}
            </template>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
