<script setup lang="ts">
  import type { AlertType } from 'composables/useAlerts'

  const useAuth = useAuthStore()

  const companies = await $fetch('/api/company', { method: 'GET' })

  const events = ref({})
  const eventsByDate: Ref<{ [key: string]: any[] }> = ref({})
  const dates = ref([])
  const fetchAndUpdateEvents = async () => {
    try {
      const updatedEvents = await getEvents()
      events.value = updatedEvents
      eventsByDate.value = groupEventsByDateStart(updatedEvents)
      dates.value = Object.keys(eventsByDate.value)
      state.selectedDate = dates.value[0] || ''
    } catch (err) {
      console.error(err)
    }
  }

  const initialState = {
    selectedDate: dates.value[0] as string,
  }

  const state = reactive({
    ...initialState,
  })

  const initialAlertState = {
    show: false,
    alertRoute: '',
    type: undefined as AlertType,
  }

  const alertState = reactive({
    ...initialAlertState,
  })

  onMounted(() => {
    fetchAndUpdateEvents()
  })
</script>

<template>
  <VSnackbar v-model="alertState.show">
    {{ $t(`${alertState.alertRoute}`) }}

    <template #actions>
      <v-btn
        :color="alertState.type"
        variant="text"
        @click="alertState.show = false"
      >
        {{ $t('alert.close_alert') }}
      </v-btn>
    </template>
  </VSnackbar>

  <VContainer>
    <VTabs v-model="state.selectedDate" fixed-tabs color="primary" class="tabs">
      <VTab v-for="date in dates" :key="date" :value="date">
        {{ getNumericDayAndMonthString(date) }}
      </VTab>
    </VTabs>
  </VContainer>
  <VContainer>
    <div v-if="eventsByDate[state.selectedDate]" class="container">
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
              <span v-else class="mb-2">
                {{ event.location.name }}
              </span>
            </span>
            <span class="card__timeinterval mb-2">
              <VIcon color="primary">mdi-clock</VIcon>
              <span>
                {{ getHourAndMinuteStringFromString(event.date.start) }} -
                {{ getHourAndMinuteStringFromString(event.date.end) }}
              </span>
            </span>
            <span v-if="event.limitedCapacity" class="card__attendees mb-2">
              <VIcon
                v-if="
                  Object.hasOwn(event, 'attendants') &&
                  event?.attendants?.length >= 3
                "
                color="primary"
              >
                mdi-account-group
              </VIcon>
              <VIcon v-else color="primary">mdi-account</VIcon>
              <span>
                <span v-if="Object.hasOwn(event, 'attendants')">
                  {{ Object.values(event.attendants).length }}
                </span>
                <span v-else>0</span>
                / {{ event.capacity }}
              </span>
            </span>
          </template>

          <template v-if="event.limitedCapacity" #actions>
            <VBtn
              v-if="
                (useAuth.isLoggedIn &&
                  event.attendants &&
                  !Object.values(event.attendants).includes(
                    useAuth?.user?.uid
                  )) ||
                !event.attendants
              "
              color="primary"
              variant="tonal"
              density="comfortable"
              @click.stop="
                () => {
                  signUpForEvent(event.id)
                    .then(async () => {
                      fetchAndUpdateEvents()
                    })
                    .catch((error) => {
                      const content = getAlertRouteAndType(error.statusMessage)

                      alertState.alertRoute = content.route
                      alertState.type = content.type as AlertType
                      alertState.show = true
                      console.error(error)
                    })
                }
              "
              >{{ $t('program.event.sign_up') }}</VBtn
            >
            <VBtn
              v-if="
                useAuth.isLoggedIn &&
                event.attendants &&
                Object.values(event.attendants).includes(useAuth?.user?.uid)
              "
              color="primary"
              variant="tonal"
              density="comfortable"
              @click.stop="
                () => {
                  optOutOfEvent(event.id)
                    .then(() => {
                      console.log('Successfully retracted signup for event')
                      fetchAndUpdateEvents()
                    })
                    .catch((err) => console.error(err))
                }
              "
              >{{ $t('program.event.opt_out') }}</VBtn
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
