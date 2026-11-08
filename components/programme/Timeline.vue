<script setup lang="ts">
  import { Clock, MapPin, User, Users } from '@lucide/vue'
  import StandMap from '@/components/programme/StandMap.vue'
  import { Card } from '@/components/ui/card'
  import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import { Instant } from '@/domain/time'
  import { companyName, type ListedCompanies } from '@/lib/companies'
  import {
    initialDay,
    type ProgrammeDay,
    type ProgrammeEvent,
  } from '@/lib/programme'

  const props = defineProps<{
    days: ProgrammeDay[]
    maps: Map<string, string>
    companies: ListedCompanies | undefined
  }>()

  const { t } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()

  const MONTHS = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ]
  const WEEKDAYS = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]

  const hhmm = (value: string | undefined) =>
    value?.split('T')[1]?.slice(0, 5) ?? ''
  const dayParts = (value: string | undefined) => {
    const [, month = '1', day = '1'] = (value ?? '').slice(0, 10).split('-')
    return { day: Number(day), month: Number(month) }
  }
  const tabLabel = (date: string) => {
    const { day, month } = dayParts(date)
    return `${day}. ${t(`datetime.months.${MONTHS[month - 1]}`).substring(0, 3)}`
  }
  const numericDate = (value: string | undefined) => {
    const { day, month } = dayParts(value)
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
  }
  const weekday = (date: string) =>
    t(`weekday.${WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]}`)

  const attendants = (event: ProgrammeEvent) =>
    Object.keys(event.attendants ?? {}).length

  // the day in the address wins, so a shared link opens on it
  const fromQuery = String(route.query.dag ?? '')
  const selectedDate = ref<string | null>(
    props.days.some((day) => day.date === fromQuery)
      ? fromQuery
      : initialDay(props.days, Instant.now()),
  )

  // replaceState instead of the router, so switching tabs does not count as navigation
  watch(selectedDate, (date) => {
    if (!date) return
    const url = new URL(window.location.href)
    url.searchParams.set('dag', date)
    window.history.replaceState(window.history.state, '', url)
  })

  const selectedEvents = computed(
    () => props.days.find((day) => day.date === selectedDate.value)?.events,
  )
  const selectedStandMap = computed(() =>
    selectedDate.value ? (props.maps.get(selectedDate.value) ?? null) : null,
  )
</script>

<template>
  <div
    class="tw:mx-auto tw:w-full tw:p-4 tw:min-[960px]:max-w-[900px] tw:min-[1280px]:max-w-[1200px] tw:min-[1920px]:max-w-[1800px]"
  >
    <Tabs
      :model-value="selectedDate ?? undefined"
      @update:model-value="(date) => (selectedDate = String(date))"
    >
      <TabsList
        class="tw:h-12 tw:w-full tw:rounded-none tw:bg-transparent tw:p-0"
      >
        <TabsTrigger
          v-for="day in days"
          :key="day.date"
          :value="day.date"
          class="tw:relative tw:h-12 tw:max-w-[300px] tw:min-w-[90px] tw:rounded-none tw:border-0 tw:px-4 tw:text-sm tw:font-medium tw:tracking-[0.0892em] tw:text-black/87 tw:after:absolute tw:after:inset-x-0 tw:after:bottom-0 tw:after:h-0.5 tw:after:bg-brand tw:after:opacity-0 tw:hover:bg-black/4 tw:data-[state=active]:bg-[#C33C3B]/8 tw:data-[state=active]:text-brand tw:data-[state=active]:shadow-none tw:data-[state=active]:after:opacity-100"
        >
          {{ tabLabel(day.date) }}
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div
      v-if="selectedDate && selectedStandMap"
      class="tw:mt-8 tw:flex tw:justify-center"
    >
      <StandMap :url="selectedStandMap" :day="weekday(selectedDate)" />
    </div>

    <ol v-if="selectedEvents" class="timeline tw:mt-8">
      <li v-for="event in selectedEvents" :key="event.uid" class="entry">
        <div class="entry__time tw:text-right tw:font-bold">
          <span
            class="tw:block tw:text-[1.2rem] tw:leading-[1.333] tw:text-brand tw:min-[960px]:text-2xl"
          >
            {{ numericDate(event.date?.start) }}
          </span>
          <span
            class="tw:block tw:text-[1.4rem] tw:leading-[1.175] tw:tracking-[0.0074em] tw:min-[960px]:text-[2.125rem]"
          >
            {{ hhmm(event.date?.start) }}
          </span>
        </div>

        <NuxtLink
          :to="localePath(`/event/${event.uid}`)"
          class="entry__card tw:group tw:mb-4 tw:block tw:rounded-[4px] tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-ring"
        >
          <Card
            class="tw:gap-0 tw:rounded-[4px] tw:border-0 tw:py-0 tw:text-black/87 tw:shadow-[0_3px_1px_-2px_rgba(0,0,0,0.2),0_2px_2px_0_rgba(0,0,0,0.14),0_1px_5px_0_rgba(0,0,0,0.12)] tw:transition-colors tw:group-hover:bg-[#f5f5f5]"
          >
            <div class="tw:px-4 tw:py-2.5">
              <div
                class="tw:truncate tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]"
              >
                {{ event.title }}
              </div>
              <div
                class="tw:truncate tw:pb-1 tw:text-sm tw:leading-[1.425] tw:tracking-[0.0178em] tw:opacity-60"
              >
                {{ companyName(companies, event.companyUID) || 'E&T-dagene' }}
              </div>
            </div>

            <div
              class="tw:px-4 tw:pb-4 tw:text-sm tw:leading-[1.425] tw:tracking-[0.0178em] tw:[&>span]:mb-2 tw:[&>span]:flex tw:[&>span]:items-center tw:[&>span]:gap-2"
            >
              <span>
                <MapPin class="tw:size-[21px] tw:text-brand" />
                {{ event.location?.name }}
              </span>
              <span>
                <Clock class="tw:size-[21px] tw:text-brand" />
                {{ hhmm(event.date?.start) }} - {{ hhmm(event.date?.end) }}
              </span>
              <span v-if="event.capacity">
                <Users
                  v-if="attendants(event) >= 3"
                  class="tw:size-[21px] tw:text-brand"
                />
                <User v-else class="tw:size-[21px] tw:text-brand" />
                {{ attendants(event) }} / {{ event.capacity }}
              </span>
            </div>
          </Card>
        </NuxtLink>
      </li>
    </ol>
  </div>
</template>

<style scoped>
  .timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .entry {
    position: relative;
  }

  .entry__time {
    position: absolute;
    left: -9.125rem;
    top: 10px;
  }

  .entry__card {
    position: relative;
    width: 600px;
  }

  /* the line down to the next event */
  .entry::before {
    content: '';
    position: absolute;
    left: -1.5rem;
    top: 15px;
    height: calc(100% + 0.5rem);
    border-left: 4px solid #000;
  }

  .entry:last-child::before {
    display: none;
  }

  /* the dot at the event's start */
  .entry::after {
    --dot: 1.5rem;
    content: '';
    position: absolute;
    top: 15px;
    left: calc(-1.5rem - var(--dot) / 2 + 0.125rem);
    width: var(--dot);
    height: var(--dot);
    border: 2px solid #000;
    border-radius: 50%;
    background: #121212;
  }

  @media (max-width: 959.98px) {
    .entry__card {
      left: -0.75rem;
    }

    .entry__time {
      left: -6.825rem;
    }

    .entry::before {
      left: -1.8rem;
    }

    .entry::after {
      --dot: 1rem;
      left: calc(-1.8rem - var(--dot) / 2 + 0.125rem);
    }
  }

  @media (max-width: 599.98px) {
    .timeline {
      transform: translateX(6.5rem);
      width: 60vw;
    }

    .entry__card {
      width: 60vw;
    }
  }

  @media (min-width: 600px) and (max-width: 959.98px) {
    .timeline {
      transform: translateX(9rem);
      width: fit-content;
    }

    .entry__card {
      width: 50vw;
    }
  }
</style>
