<script setup lang="ts">
  import { AlertType } from 'composables/useAlerts'

  const useAuth = useAuthStore()

  // get event id from route
  const route = useRoute()
  const eventUid = route.params.id

  // fetch event information from query
  const { data, refresh } = await useFetch('/api/event', {
    method: 'GET',
    query: {
      eventUID: eventUid,
    },
  })

  // fetch all companies
  const { data: companies } = await useFetch('/api/company')

  // embed uid into object
  const event = computed(() => embedKeyIntoObjectValues(data.value)[0])

  // get company information
  const company = computed(
    () => companies.value[event.value.companyUID] || null
  )

  // get day and month strings from date
  const eventStartString = computed(
    () =>
      `${getDayAndMonthString(
        event.value.date.start
      )} ${getHourAndMinuteStringFromString(event.value.date.start)}`
  )
  const eventEndString = computed(
    () =>
      `${getDayAndMonthString(
        event.value.date.end
      )} ${getHourAndMinuteStringFromString(event.value.date.end)}`
  )

  // check if event has capacity and attendants
  const hasAttendants = computed(
    () => !!event.value.attendants || Object.hasOwn(event.value, 'attendants')
  )
  const hasCapacity = computed(() => !!event.value.capacity)

  // check if user is already registered for event
  const alreadyRegistered = computed(
    () =>
      hasAttendants.value &&
      Object.values(event.value.attendants).includes(useAuth?.user?.uid)
  )

  // check if event is full
  const eventFull = computed(
    () =>
      hasCapacity.value &&
      hasAttendants.value &&
      event.value.attendants.length >= event.value.capacity
  )

  // check if user is already registered for event
  const showSignupButton = computed(
    () => hasCapacity.value && !alreadyRegistered.value && !eventFull.value
  )

  // alert state
  const initialAlertState = {
    show: false,
    alertRoute: '',
    type: undefined as AlertType,
  }

  const alertState = reactive({
    ...initialAlertState,
  })

  // Show appropriate success alert after signing up for event
  const displaySuccessAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'success'
    alertState.show = true
  }

  // Show appropriate error alert for failed API calls
  const displayErrorAlertFromMessage = (errorMessage: string) => {
    const content = getAlertContent(errorMessage)
    alertState.alertRoute = content.alertRoute
    alertState.type = content.type
    alertState.show = content.show

    console.error(errorMessage)
  }

  // sign up for event
  const signUpForEvent = () => {
    $fetch('/api/event/register', {
      method: 'POST',
      body: { eventUID: event.value.uid },
    })
      .then(() => refresh())
      .then(() => displaySuccessAlert('alert.success.event.register.sign_up'))
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }

  // opt out of event
  const optOutOfEvent = () => {
    $fetch('/api/event/register', {
      method: 'DELETE',
      body: { eventUID: event.value.uid },
    })
      .then(() => refresh())
      .then(() => displaySuccessAlert('alert.success.event.register.opt_out'))
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }
</script>

<template>
  <VContainer class="container">
    <!-- Vuetify alert component -->
    <!-- TODO: #121 Make a custom reactive component for VSnackbar that takes in content prop -->
    <VSnackbar v-model="alertState.show">
      {{ $t(`${alertState.alertRoute}`) }}

      <template #actions>
        <VBtn
          :color="alertState.type"
          variant="text"
          @click="alertState.show = false"
        >
          {{ $t('alert.close_alert') }}
        </VBtn>
      </template>
    </VSnackbar>

    <!-- company logo -->
    <VCard
      class="d-flex justify-center align-center pa-4 image-container"
      flat
      rounded="lg"
    >
      <NuxtImg
        class="image"
        fit="contain"
        :src="company?.logo || 'images/logo_long.png'"
      />
    </VCard>

    <!-- event description -->
    <VCard class="description elevation-4" rounded="lg">
      <VCardTitle class="title">{{ event?.title }}</VCardTitle>
      <VCardText class="text">{{ event?.description }}</VCardText>
    </VCard>

    <!-- event details -->
    <VCard class="details elevation-4" rounded="lg">
      <VCardTitle class="details__title">
        {{ $t('event.page.details.name') }}
      </VCardTitle>

      <VCardText class="details__from pt-5 pb-5">
        <strong>{{ $t('event.page.details.from') }}:</strong>
        {{ eventStartString }}
      </VCardText>

      <VCardText class="details__to py-0 pb-5">
        <strong>{{ $t('event.page.details.to') }}:</strong>
        {{ eventEndString }}
      </VCardText>

      <VCardText class="details__location py-0 pb-5">
        <strong>{{ $t('event.page.details.location') }}: </strong>
        <NuxtLink
          v-if="event.location.map"
          :to="event.location.map"
          class="link"
          target="_blank"
          @click.stop
        >
          {{ event.location.name }}
          <VIcon size="x-small" color="primary">mdi-open-in-new</VIcon>
        </NuxtLink>
        <span v-else>
          {{ event.location.name }}
        </span>
      </VCardText>

      <VCardText class="details__host py-0 pb-5">
        <strong>{{ $t('event.page.details.host') }}: </strong>
        <NuxtLink v-if="company" :to="company?.webpage" target="_blank">
          {{ company?.name }}
          <VIcon size="xsmall" color="primary">mdi-open-in-new</VIcon>
        </NuxtLink>

        <span v-else>{{ 'E&T-dagene' }}</span>
      </VCardText>
    </VCard>

    <!-- event registration -->
    <div class="attendant-container">
      <VCard
        class="attendants elevation-4"
        height="84"
        color="primary"
        rounded="lg"
      >
        <VCardTitle class="attendants__title">
          {{ $t('event.page.attendants.name') }}
        </VCardTitle>

        <VCardText
          v-if="hasCapacity && hasAttendants"
          class="attendants__count"
        >
          {{ $t('event.page.attendants.attendants') }}:
          {{ Object.values(event.attendants).length }}
          {{ event.capacity ? `/ ${event.capacity}` : '' }}
        </VCardText>

        <VCardText v-else>
          {{ $t('event.page.attendants.nocapacity') }}
        </VCardText>
      </VCard>

      <!-- Event actions: Sign up perform action -->
      <div
        v-if="!useAuth.isLoggedIn && hasCapacity && !eventFull"
        class="text-primary px-4 py-2 d-flex justify-center align-center"
      >
        <VIcon class="pr-3 pb-1">mdi-lock</VIcon>
        {{ $t('program.event.sign_in_to_register') }}
      </div>

      <!-- sign up options -->
      <div v-if="hasCapacity && useAuth.isLoggedIn">
        <!-- sign up -->
        <VBtn
          v-if="showSignupButton"
          color="success"
          block
          variant="tonal"
          :ripple="true"
          density="comfortable"
          :disabled="eventFull"
          @click.stop="signUpForEvent"
        >
          {{ $t('program.event.sign_up') }}
        </VBtn>

        <!-- opt out -->
        <VBtn
          v-if="alreadyRegistered"
          color="primary"
          block
          variant="tonal"
          :ripple="true"
          density="comfortable"
          @click.stop="optOutOfEvent"
        >
          {{ $t('program.event.opt_out') }}
        </VBtn>
      </div>
    </div>
  </VContainer>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';
  .container {
    display: grid;
    width: 100vw;
    grid-template-columns: 1fr 3fr;
    gap: 1rem;
    grid-template-areas: 'details image' 'attendants description';

    .image-container {
      max-height: 300px;

      .image {
        width: 100%;
      }
    }

    .description {
      grid-area: description;
    }
    .details {
      grid-area: details;
    }

    .attendant-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .attendants {
      grid-area: attendants;
    }

    @media #{map-get(settings.$display-breakpoints, 'lg-and-up')} {
      max-width: 1080px;
    }

    @media #{map-get(settings.$display-breakpoints, 'md-and-down')} {
      max-width: 750px;
      grid-template-areas: 'image' 'details' 'attendants' 'description';
      grid-template-columns: 1fr;
    }

    @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
      max-width: 420px;
    }
  }
</style>
