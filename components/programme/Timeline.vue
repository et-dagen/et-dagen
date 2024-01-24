<script setup lang="ts">
  // use locale path for navigation
  const localePath = useLocalePath()

  // Fetch company and event data from API
  const { data: companies } = await useFetch('/api/company')
  const { data: events } = await useFetch('/api/event')

  // Group events by date
  const eventsByDate: any = computed(() =>
    sortDateGroupedEventsByStartTime(groupEventsByDateStart(events.value))
  )
  const dates = computed(() => Object.keys(eventsByDate.value)) // Get all dates from eventsByDate

  // Check if event has attendants
  const hasAttendants = computed(
    () => (event: any) => event.attendants || Object.hasOwn(event, 'attendants')
  )

  // Check if event has more than two attendants
  const showGroupIcon = computed(() => {
    return (event: any) => {
      return hasAttendants.value(event) && event.attendants.length >= 3
    }
  })

  // Set initial selected date to show
  const initialState = {
    selectedDate: dates.value[0] as string,
  }

  const state = reactive({
    ...initialState,
  })
</script>

<template>
  <!-- Date selection tabs -->
  <VContainer>
    <VTabs v-model="state.selectedDate" fixed-tabs color="primary" class="tabs">
      <VTab
        v-for="date in dates"
        :key="date"
        :value="date"
        :class="{
          'v-tab--selected': state.selectedDate === date,
        }"
      >
        {{ getNumericDayAndMonthString(date) }}
      </VTab>
    </VTabs>
  </VContainer>

  <!-- Timeline container -->
  <VContainer>
    <div v-if="eventsByDate[state.selectedDate]" class="container">
      <div
        v-for="event in eventsByDate[state.selectedDate]"
        :key="event.id"
        class="card__div"
      >
        <!-- Event card timestamp and date -->
        <div class="card__timestamp">
          <span class="date text-h5 text-primary bold">
            {{ getNumericDayAndMonthString(event.date.start) }}
          </span>
          <br />
          <span class="time text-h4 bold">
            {{ getHourAndMinuteStringFromString(event.date.start) }}
          </span>
        </div>

        <!-- Event card -->
        <VCard
          width="600"
          elevation="2"
          class="card mb-4"
          variant="flat"
          :ripple="false"
          @click="() => navigateTo(localePath(`/event/${event.id}`))"
        >
          <template #title> {{ event.title }} </template>

          <!-- Display company name if found -->
          <template v-if="companies[event.companyUID]" #subtitle>
            {{ companies[event.companyUID].name }}
          </template>
          <template v-else #subtitle> E&T-dagene </template>

          <template #text>
            <!-- Event location -->
            <span class="card__location mb-2">
              <VIcon color="primary">mdi-map-marker</VIcon>
              {{ event.location.name }}
            </span>

            <!-- Event start and end time -->
            <span class="card__timeinterval mb-2">
              <VIcon color="primary">mdi-clock</VIcon>
              <span>
                {{ getHourAndMinuteStringFromString(event.date.start) }} -
                {{ getHourAndMinuteStringFromString(event.date.end) }}
              </span>
            </span>

            <!-- Event capacity -->
            <span v-if="event.capacity" class="card__attendees mb-2">
              <!-- Group icon -->
              <VIcon v-if="showGroupIcon(event)" color="primary">
                mdi-account-group
              </VIcon>
              <VIcon v-else color="primary">mdi-account</VIcon>

              <!-- Capacity count -->
              <span>
                <span v-if="hasAttendants(event)">
                  {{ Object.values(event.attendants).length }}
                </span>
                <span v-else>0</span>
                / {{ event.capacity }}
              </span>
            </span>
          </template>
        </VCard>
      </div>
    </div>
  </VContainer>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem !important;
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

  .card {
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
        display: inline-block !important;
        content: '';
        position: absolute !important;
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
          height: calc(100% - 1.9rem);
          display: none !important;
        }
      }
    }

    &__location,
    &__timeinterval,
    &__attendees {
      display: flex;
      flex-direction: row;
      align-items: center;
      $card-gap: 0.5rem;
      gap: $card-gap;

      .link,
      .link:visited {
        color: rgb(var(--v-theme-neutral));
      }
    }
  }

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    .container {
      transform: translateX(9rem);
      max-width: 200px;
    }

    .card {
      left: -0.75rem;

      &__timestamp {
        position: absolute;
        left: -6.7rem - 0.125rem;
        top: 10px;
        text-align: right;
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
      font-size: 1.2rem !important;
    }

    .time {
      font-size: 1.4rem !important;
    }

    .card {
      width: 250px !important;
    }

    .tabs {
      width: 100% !important;
    }
  }
</style>