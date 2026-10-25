<script setup lang="ts">
  import StandMap from '@/components/programme/StandMap.vue'
  import CompanyLogo from '@/components/admin/CompanyLogo.vue'
  import { Instant } from '@/domain/time'
  import { eventStatus, placeOf } from '@/lib/admin/events'
  import { isOver, type ProgrammeDay } from '@/lib/programme'

  const props = defineProps<{
    day: ProgrammeDay
    map: string | null
    companies: Record<string, { name?: string; logo?: string }>
  }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const now = Instant.now()

  const heading = computed(() =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${props.day.date}T12:00:00Z`)),
  )
  const hhmm = (value: string | undefined) =>
    value?.split('T')[1]?.slice(0, 5) ?? ''
  const status = (event: ProgrammeDay['events'][number]) =>
    eventStatus(event, now).kind
</script>

<template>
  <section
    :id="`day-${day.date}`"
    class="tw:scroll-mt-24"
    :aria-labelledby="`heading-${day.date}`"
  >
    <div
      class="tw:sticky tw:top-0 tw:z-[1] tw:-mx-4 tw:flex tw:items-center tw:justify-between tw:gap-4 tw:bg-background/95 tw:px-4 tw:py-3 tw:backdrop-blur-sm tw:lg:mx-0 tw:lg:px-0"
    >
      <div>
        <h2
          :id="`heading-${day.date}`"
          class="tw:text-2xl tw:font-extrabold tw:tracking-tight tw:first-letter:uppercase"
        >
          {{ heading }}
        </h2>
        <p class="tw:text-sm tw:text-muted-foreground">
          {{ $t('programme.count', day.events.length) }}
        </p>
      </div>
      <StandMap v-if="map" :url="map" :day="heading" />
    </div>

    <ol
      class="tw:mt-2 tw:grid tw:grid-cols-[4.5rem_minmax(0,1fr)] tw:sm:grid-cols-[6rem_minmax(0,1fr)]"
    >
      <li
        v-for="event in day.events"
        :key="event.uid"
        class="tw:contents"
        :data-over="isOver(event, now) || undefined"
      >
        <time
          :datetime="event.date?.start"
          class="tw:pt-4 tw:text-xl tw:font-extrabold tw:tabular-nums tw:sm:text-2xl tw:[[data-over]>&]:text-muted-foreground"
        >
          {{ hhmm(event.date?.start) }}
        </time>
        <div
          class="tw:relative tw:border-l-[3px] tw:border-border tw:py-3 tw:pl-5"
        >
          <span
            class="tw:absolute tw:top-5 tw:-left-[9px] tw:size-[15px] tw:rounded-full tw:border-[3px] tw:border-background tw:bg-plate tw:[[data-over]_&]:bg-muted-foreground"
            aria-hidden="true"
          />
          <NuxtLink
            :to="localePath(`/event/${event.uid}`)"
            class="tw:group tw:flex tw:items-start tw:gap-3 tw:rounded-lg tw:border tw:bg-card tw:p-3.5 tw:transition-colors tw:hover:border-plate/40 tw:[[data-over]_&]:opacity-60"
          >
            <CompanyLogo
              v-if="event.companyUID && companies[event.companyUID]"
              :src="companies[event.companyUID]?.logo"
              :name="companies[event.companyUID]?.name"
              size="md"
            />
            <span class="tw:min-w-0 tw:flex-1">
              <span
                class="tw:block tw:font-bold tw:group-hover:underline tw:group-hover:underline-offset-4"
              >
                {{ event.title }}
              </span>
              <span
                class="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-sm tw:text-muted-foreground"
              >
                <span
                  v-if="event.companyUID && companies[event.companyUID]"
                  class="tw:font-semibold tw:text-foreground"
                >
                  {{ companies[event.companyUID]?.name }}
                </span>
                <span
                  v-if="event.location?.name"
                  class="tw:inline-flex tw:items-center tw:gap-1.5"
                >
                  <span
                    v-if="placeOf(event.location.name).code"
                    class="tw:rounded-sm tw:bg-plate tw:px-1.5 tw:pt-0.5 tw:text-xs tw:font-extrabold tw:text-plate-foreground"
                  >
                    {{ placeOf(event.location.name).code }}
                  </span>
                  {{ placeOf(event.location.name).name || event.location.name }}
                </span>
                <span class="tw:tabular-nums">
                  {{ hhmm(event.date?.start) }}–{{ hhmm(event.date?.end) }}
                </span>
              </span>
              <span
                v-if="status(event) !== 'past'"
                class="tw:mt-2 tw:inline-block tw:rounded-sm tw:bg-muted tw:px-2 tw:pt-0.5 tw:text-xs tw:font-semibold"
              >
                {{ $t(`programme.status.${status(event)}`) }}
              </span>
            </span>
          </NuxtLink>
        </div>
      </li>
    </ol>
  </section>
</template>
