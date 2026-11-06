<script setup lang="ts">
  import type { ListedCompany } from '@/lib/companies'
  import StandMap from '@/components/programme/StandMap.vue'
  import CompanyLogo from '@/components/common/CompanyLogo.vue'
  import { Instant } from '@/domain/time'
  import { eventStatus, placeOf } from '@/lib/events'
  import { isOver, type ProgrammeDay } from '@/lib/programme'
  import { formatDay } from '@/lib/time'

  const props = defineProps<{
    day: ProgrammeDay
    map: string | null
    companies: Record<string, ListedCompany>
  }>()

  const { locale } = useI18n()
  const localePath = useLocalePath()
  const now = Instant.now()

  const heading = computed(() =>
    formatDay(props.day.date, locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  )
  const hhmm = (value: string | undefined) =>
    value?.split('T')[1]?.slice(0, 5) ?? ''
  const status = (event: ProgrammeDay['events'][number]) =>
    eventStatus(event, now).kind
</script>

<template>
  <section :id="`day-${day.date}`" :aria-labelledby="`heading-${day.date}`">
    <!-- the stuck heading takes the exact page ground, so it shows only once content passes under it -->
    <div
      class="sticky top-0 z-[1] -mx-4 flex items-center justify-between gap-4 bg-background px-4 py-3 lg:mx-0 lg:px-0"
    >
      <div>
        <h2
          :id="`heading-${day.date}`"
          class="text-2xl font-extrabold tracking-tight first-letter:uppercase"
        >
          {{ heading }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ $t('programme.count', day.events.length) }}
        </p>
      </div>
      <StandMap v-if="map" :url="map" :day="heading" class="hidden sm:block" />
    </div>
    <!-- on a phone the map sits under the heading, so the stuck heading stays one line -->
    <StandMap v-if="map" :url="map" :day="heading" class="mt-1 sm:hidden" />

    <ol
      class="mt-2 grid grid-cols-[4.5rem_minmax(0,1fr)] sm:grid-cols-[6rem_minmax(0,1fr)]"
    >
      <li
        v-for="event in day.events"
        :key="event.uid"
        class="contents"
        :data-over="isOver(event, now) || undefined"
      >
        <time
          :datetime="event.date?.start"
          class="pt-4 text-xl font-extrabold tabular-nums sm:text-2xl [[data-over]>&]:text-muted-foreground"
        >
          {{ hhmm(event.date?.start) }}
        </time>
        <div class="relative border-l-[3px] border-plate/25 py-2 pl-4">
          <span
            class="absolute top-[1.375rem] -left-[9px] size-[15px] rounded-full border-[3px] border-background bg-plate [[data-over]_&]:bg-muted-foreground"
            aria-hidden="true"
          />
          <NuxtLink
            :to="localePath(`/event/${event.uid}`)"
            class="group flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-plate/5 [[data-over]_&]:opacity-60"
          >
            <CompanyLogo
              v-if="event.companyUID && companies[event.companyUID]"
              :src="companies[event.companyUID]?.logo"
              :name="companies[event.companyUID]?.name"
              size="md"
            />
            <span class="min-w-0 flex-1">
              <span
                class="block font-bold group-hover:underline group-hover:underline-offset-4"
              >
                {{ event.title }}
              </span>
              <span
                class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground"
              >
                <span
                  v-if="event.companyUID && companies[event.companyUID]"
                  class="font-semibold text-foreground"
                >
                  {{ companies[event.companyUID]?.name }}
                </span>
                <span
                  v-if="event.location?.name"
                  class="inline-flex items-center gap-1.5"
                >
                  <span
                    v-if="placeOf(event.location.name).code"
                    class="rounded-sm bg-plate px-1.5 pt-0.5 text-xs font-extrabold text-plate-foreground"
                  >
                    {{ placeOf(event.location.name).code }}
                  </span>
                  {{ placeOf(event.location.name).name || event.location.name }}
                </span>
                <span class="tabular-nums">
                  {{ hhmm(event.date?.start) }}–{{ hhmm(event.date?.end) }}
                </span>
              </span>
              <span
                v-if="status(event) !== 'past'"
                class="mt-2 inline-block rounded-sm bg-muted px-2 pt-0.5 text-xs font-semibold"
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
