<script setup lang="ts">
  import CommonModal from '@/components/common/Modal.vue'
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

  const showStandMap = ref(false)
</script>

<template>
  <div class="timeline-container">
    <!-- Date selection tabs -->
    <VContainer>
      <VTabs v-model="selectedDate" fixed-tabs color="primary" class="tabs">
        <VTab
          v-for="day in days"
          :key="day.date"
          :value="day.date"
          :class="{ 'v-tab--selected': selectedDate === day.date }"
        >
          {{ tabLabel(day.date) }}
        </VTab>
      </VTabs>
    </VContainer>

    <!--View standmap button-->
    <VContainer
      v-if="selectedDate && selectedStandMap"
      class="d-flex justify-center"
    >
      <VBtn
        class="w-75 standmap-button"
        max-width="600"
        color="accent"
        @click="showStandMap = true"
      >
        <VIcon class="mx-3">mdi-map</VIcon>
        {{ $t('program.standmap') }}:
        {{ weekday(selectedDate) }}
      </VBtn>
    </VContainer>

    <!--Standmap-->
    <CommonModal
      v-if="showStandMap && selectedDate && selectedStandMap"
      @close-modal="showStandMap = false"
    >
      <img
        :src="selectedStandMap"
        :alt="$t('programme.map.title', { day: weekday(selectedDate) })"
        class="w-75 standmap"
      />
    </CommonModal>

    <!-- Timeline container -->
    <VContainer>
      <div v-if="selectedEvents" class="container">
        <div v-for="event in selectedEvents" :key="event.uid" class="card__div">
          <!-- Event card timestamp and date -->
          <div class="card__timestamp">
            <span class="date text-primary bold">
              {{ numericDate(event.date?.start) }}
            </span>
            <br />
            <span class="time bold">
              {{ hhmm(event.date?.start) }}
            </span>
          </div>

          <!-- Event card -->
          <VCard
            elevation="2"
            class="card mb-4"
            variant="flat"
            :ripple="false"
            @click="() => navigateTo(localePath(`/event/${event.uid}`))"
          >
            <template #title> {{ event.title }} </template>

            <!-- Display company name if found -->
            <template #subtitle>
              {{ companyName(companies, event.companyUID) || 'E&T-dagene' }}
            </template>

            <template #text>
              <!-- Event location -->
              <span class="card__location mb-2">
                <VIcon color="primary">mdi-map-marker</VIcon>
                {{ event.location?.name }}
              </span>

              <!-- Event start and end time -->
              <span class="card__timeinterval mb-2">
                <VIcon color="primary">mdi-clock</VIcon>
                <span>
                  {{ hhmm(event.date?.start) }} -
                  {{ hhmm(event.date?.end) }}
                </span>
              </span>

              <!-- Event capacity -->
              <span v-if="event.capacity" class="card__attendees mb-2">
                <VIcon v-if="attendants(event) >= 3" color="primary">
                  mdi-account-group
                </VIcon>
                <VIcon v-else color="primary">mdi-account</VIcon>

                <span>{{ attendants(event) }} / {{ event.capacity }}</span>
              </span>
            </template>
          </VCard>
        </div>
      </div>
    </VContainer>
  </div>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  // Vuetify's text-h* classes, without their !important font size, so phones can shrink them
  @mixin heading($name) {
    $style: map.get(settings.$typography, $name);
    font-family: map.get($style, 'font-family');
    font-size: map.get($style, 'size');
    line-height: map.get($style, 'line-height');
    letter-spacing: map.get($style, 'letter-spacing');
  }

  .date {
    @include heading('h5');
  }

  .time {
    @include heading('h4');
  }

  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    max-width: 100vw;
  }

  .timeline-container {
    width: 95vw;
    margin: 0 auto; /* Center the container horizontally */
  }

  .v-tab {
    max-width: 600px;
  }

  .bold {
    font-weight: bold;
  }

  .v-tab--selected {
    background: rgba(var(--v-theme-accent), 0.08);
  }

  .standmap-button {
    min-width: fit-content;
  }

  .standmap {
    object-fit: contain;
  }

  .card {
    width: 600px;

    &__timestamp {
      position: absolute;
      left: -9rem - 0.125rem;
      top: 10px;
      text-align: right;
    }

    &__div {
      position: relative;

      &::before {
        // Node line
        display: inline-block;
        content: '';
        position: absolute;
        left: -1.5rem;
        top: 15px;
        border-left: 4px solid #000;
        height: calc(100% + 0.5rem);
      }

      &::after {
        // Node circle
        $node-width: 1.5rem;
        content: '';
        display: inline-block;
        position: absolute;
        top: 15px;
        left: -1.5rem - calc($node-width / 2) + 0.125rem;
        width: $node-width;
        height: $node-width;
        border: 2px solid #000;
        border-radius: 50%;
        margin-top: 0px;
        background-color: rgb(var(--v-theme-neutral));
      }

      &:last-child {
        &::before {
          // Node line
          display: none;
        }
      }
    }

    &__location,
    &__timeinterval,
    &__attendees {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }
  }

  @media #{map.get(settings.$display-breakpoints, 'xs')} {
    .container {
      transform: translateX(6.5rem);
      width: 60vw;

      .v-card {
        width: 60vw;
      }
    }
  }

  @media #{map.get(settings.$display-breakpoints, 'sm')} {
    .container {
      transform: translateX(9rem);
      width: fit-content;
    }

    .card {
      width: 50vw;
    }
  }

  @media #{map.get(settings.$display-breakpoints, 'xs')}, #{map.get(settings.$display-breakpoints, 'sm')} {
    .card {
      left: -0.75rem;

      &__timestamp {
        left: -6.7rem - 0.125rem;
      }

      &__div {
        &::before {
          // Node line
          left: -1.8rem;
        }

        &::after {
          // Node circle
          $node-width: 1rem;
          left: -1.8rem - calc($node-width / 2) + 0.125rem;
          width: $node-width;
          height: $node-width;
        }
      }
    }

    .date {
      font-size: 1.2rem;
    }

    .time {
      font-size: 1.4rem;
    }

    .tabs {
      width: 100%;
    }
  }
</style>
