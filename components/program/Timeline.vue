<script setup lang="ts">
  const events = await $fetch('/api/event', { method: 'GET' })
  const eventsByDate = groupEventsByDateStart(events)
  sortDateGroupedEventsByStartTime(eventsByDate)
  const dates = Object.keys(eventsByDate)

  const companies = await $fetch('/api/company', { method: 'GET' })

  const initialState = {
    selectedDate: dates[0] as string,
  }

  const state = reactive({
    ...initialState,
  })
</script>

<template>
  <VContainer>
    <VTabs v-model="state.selectedDate" fixed-tabs color="primary" class="tabs">
      <VTab v-for="date in dates" :key="date" :value="date">
        {{ getNumericDayAndMonthString(date) }}
      </VTab>
    </VTabs>
  </VContainer>
  <VContainer>
    <div class="container">
      <div
        v-for="event in eventsByDate[state.selectedDate]"
        :key="event.id"
        class="card__div"
      >
        <div class="card__timestamp">
          <span class="date text-h5 text-primary bold">
            {{ getNumericDayAndMonthString(event.date.start) }}
          </span>
          <br />
          <span class="time text-h4 bold">
            {{ getHourAndMinuteStringFromString(event.date.start) }}
          </span>
        </div>

        <v-card
          width="600"
          elevation="0"
          class="card mb-4"
          variant="flat"
          @click="() => navigateTo(`/program/${event.id}`)"
        >
          <template #title> {{ event.title }} </template>

          <template v-if="companies[event.companyUID]" #subtitle>
            {{ companies[event.companyUID].name }}
          </template>

          <template #text>
            <span class="card__location mb-2">
              <VIcon color="primary">mdi-map-marker</VIcon>
              <NuxtLink
                v-if="event.location.map !== 'null'"
                :to="event.location.map"
                class="link"
                @click.stop
              >
                {{ event.location.name }}
                <VIcon size="x-small">mdi-open-in-new</VIcon>
              </NuxtLink>
              <span v-else>
                {{ event.location.name }}
              </span>
            </span>
            <span class="card__timeinterval">
              <VIcon color="primary">mdi-clock</VIcon>
              <span>
                {{ getHourAndMinuteStringFromString(event.date.start) }} -
                {{ getHourAndMinuteStringFromString(event.date.end) }}
              </span>
            </span>
            <br />
            {{ event.description }}
          </template>

          <template #actions>
            <VBtn
              color="primary"
              variant="tonal"
              density="comfortable"
              @click.stop="() => console.log('test')"
              >{{ $t('program.event.sign_up') }}</VBtn
            >
          </template>
        </v-card>
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

  .bold {
    font-weight: bold;
  }

  .v-tab--selected {
    background: rgba(var(--v-theme-accent), 0.08);
  }

  .card {
    // position: relative;

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
    &__timeinterval {
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
      transform: translateX(3rem);
    }

    .card {
      left: -1rem;

      &__timestamp {
        position: absolute;
        left: -6rem - 0.125rem;
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
