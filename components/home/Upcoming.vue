<script setup lang="ts">
  import { ArrowRight } from '@lucide/vue'
  import { eventStatus, formatStart, placeOf } from '@/lib/admin/events'
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
    class="tw:mx-auto tw:max-w-screen-2xl tw:px-4 tw:py-20 tw:lg:px-8 tw:lg:py-28"
  >
    <div class="tw:flex tw:flex-wrap tw:items-end tw:justify-between tw:gap-4">
      <h2
        id="home-upcoming"
        class="tw:text-3xl tw:font-black tw:tracking-tight tw:lg:text-4xl"
      >
        {{ $t('home.upcoming') }}
      </h2>
      <NuxtLink
        :to="localePath('/programme')"
        class="tw:inline-flex tw:items-center tw:gap-2 tw:font-bold tw:underline tw:decoration-border tw:decoration-2 tw:underline-offset-[6px] tw:hover:decoration-brand"
      >
        {{ $t('home.programme') }}
        <ArrowRight class="tw:size-4" aria-hidden="true" />
      </NuxtLink>
    </div>

    <ul class="tw:mt-10 tw:divide-y tw:border-y">
      <li v-for="item in events" :key="item.uid">
        <NuxtLink
          :to="localePath(`/event/${item.uid}`)"
          class="tw:group tw:grid tw:gap-x-8 tw:gap-y-1 tw:py-5 tw:transition-colors tw:hover:bg-card tw:md:grid-cols-[13rem_minmax(0,1fr)_14rem_12rem] tw:md:items-center tw:md:px-4"
        >
          <span
            class="tw:font-semibold tw:text-muted-foreground tw:tabular-nums"
          >
            {{ when(item) }}
          </span>
          <span
            class="tw:text-lg tw:leading-snug tw:font-bold tw:group-hover:underline tw:group-hover:decoration-brand tw:group-hover:decoration-2 tw:group-hover:underline-offset-4"
          >
            {{ item.event.title }}
          </span>
          <span
            class="tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:text-muted-foreground"
          >
            <span
              v-if="placeOf(item.event.location?.name).code"
              class="tw:rounded tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:tracking-wide tw:text-plate-foreground"
            >
              {{ placeOf(item.event.location?.name).code }}
            </span>
            <span class="tw:truncate">
              {{ placeOf(item.event.location?.name).name }}
            </span>
          </span>
          <span class="tw:text-sm tw:text-muted-foreground tw:md:text-right">
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
