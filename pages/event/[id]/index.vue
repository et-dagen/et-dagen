<script setup lang="ts">
  import * as qrcode from 'qrcode'
  import AttendantsList from '~/components/event/AttendantsList.vue'
  import { type AttendantMetadata, type Attendant } from '~/models/Attendant'

  const localePath = useLocalePath()
  const useAuth = useAuthStore()
  const useAlert = useAlertStore()

  const isAdmin = useAuth.hasAccess(['admin'])

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

  const { data: users } = await useFetch('/api/user', {
    query: { scope: 'all' },
  })

  // fetch all companies
  const { data: companies } = await useFetch('/api/company')

  // embed uid into object
  const event = computed(() => embedKeyIntoObjectValues(data.value)[0])
  console.log(event.value)

  // get company information
  const company = computed(
    () => companies.value[event.value.companyUID] || null,
  )

  // check if event has capacity and attendants
  const hasAttendants = computed(
    () => !!event.value.attendants || Object.hasOwn(event.value, 'attendants'),
  )
  const hasCapacity = computed(() => !!event.value.capacity)

  const attendants = computed<Attendant[]>(() =>
    (
      Object.entries(event.value.attendants ?? {}) as [
        string,
        AttendantMetadata,
      ][]
    )
      .map(([uid, meta]) => {
        const user = users.value?.find((u: any) => u.uid === uid)
        if (!user) return null

        return {
          ...user,
          attended: meta.attended,
          registeredAt: meta.registeredAt,
        }
      })
      .filter((a): a is Attendant => Boolean(a)),
  )

  console.log(attendants.value)

  // Get the number of queued users
  const totalQueued = computed(() => {
    return event.value.queue || {}
      ? Object.keys(event.value.queue || {}).length
      : 0
  })

  // get day and month strings from date
  const eventStartString = computed(
    () =>
      `${getDayAndMonthString(
        event.value.date.start,
      )} ${getHourAndMinuteStringFromString(event.value.date.start)}`,
  )
  const eventEndString = computed(
    () =>
      `${getDayAndMonthString(
        event.value.date.end,
      )} ${getHourAndMinuteStringFromString(event.value.date.end)}`,
  )

  // get day and month strings from date
  const registrationStartString = computed(() =>
    hasCapacity.value
      ? `${getDayAndMonthString(
          event.value.registration.start,
        )} ${getHourAndMinuteStringFromString(event.value.registration.start)}`
      : null,
  )
  const registrationEndString = computed(() =>
    hasCapacity.value
      ? `${getDayAndMonthString(
          event.value.registration.end,
        )} ${getHourAndMinuteStringFromString(event.value.registration.end)}`
      : null,
  )

  const programmeRequirements = computed(
    () => event.value?.registration?.requirements?.programmes ?? null,
  )

  const hasYearsRequirements = computed(
    () => event.value?.registration?.requirements?.years ?? null,
  )

  // check if user meets registration requirements
  const meetsProgrammeRequirement =
    event.value?.registration?.requirements?.programmes?.includes(
      useAuth.user?.studyProgram,
    ) ?? true

  const meetsYearRequirement =
    event.value?.registration?.requirements?.years?.includes(
      useAuth.user?.currentYear,
    ) ?? true

  // check if user is already registered for event
  const alreadyRegistered = computed(() => {
    const uid = useAuth?.user?.uid
    if (!uid) return false

    return (
      hasAttendants.value && Object.hasOwn(event.value.attendants ?? {}, uid)
    )
  })

  // check if user is already registered for queue
  const alreadyQueued = computed(
    () =>
      (hasAttendants.value &&
        Object.values(event.value.queue || {}).includes(useAuth?.user?.uid)) ??
      false,
  )

  // check if event is full
  const eventFull = computed(
    () =>
      hasCapacity.value &&
      hasAttendants.value &&
      Object.keys(event.value.attendants || {}).length >= event.value.capacity,
  )

  // does the event have any registration actions, and is user signed in
  const hasEventActions = computed(
    () => useAuth.isLoggedIn && hasCapacity.value,
  )

  // check if registration actions should be rendered on client side
  const showRegistrationAction = ref(
    hasEventActions.value &&
      presentWithinTimeWindow(
        event.value.registration.start,
        event.value.registration.end,
      ),
  )

  // check if registration is open with interval if user is signed in and the event has a capacity
  let registrationOpenInterval: ReturnType<typeof setInterval>
  onMounted(() => {
    if (hasEventActions.value)
      registrationOpenInterval = setInterval(
        () =>
          (showRegistrationAction.value = presentWithinTimeWindow(
            event.value.registration.start,
            event.value.registration.end,
          )),
        1000,
      )
  })

  // clear interval when unmounting the component
  onBeforeUnmount(() => clearInterval(registrationOpenInterval))

  // check if user is already registered for event
  const showSignupButton = computed(
    () => hasCapacity.value && !alreadyRegistered.value && !eventFull.value,
  )

  // check if user is eligable for queue for event
  const showQueueButton = computed(
    () => hasCapacity.value && !alreadyRegistered.value && eventFull.value,
  )

  const loading = ref(false)

  // sign up for event
  const signUpForEvent = () => {
    loading.value = true

    $fetch('/api/event/register', {
      method: 'POST',
      body: { eventUID: event.value.uid },
    })
      .then(() => refresh())
      .then(() =>
        useAlert.alert(
          getI18nString('alert.success.event.register.sign_up'),
          'success',
        ),
      )
      .catch((error: any) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage,
        )
        useAlert.alert(message, type as AlertType)
      })
      .finally(() => (loading.value = false))
  }

  // Add user to the queue
  const addToQueue = () => {
    loading.value = true

    $fetch('/api/event/register', {
      method: 'POST',
      body: { eventUID: event.value.uid },
    })
      .then(() => refresh())
      .then(() =>
        useAlert.alert(
          getI18nString('alert.success.event.register.queue'),
          'success',
        ),
      )
      .catch((error: any) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage,
        )
        useAlert.alert(message, type as AlertType)
      })
      .finally(() => (loading.value = false))
  }

  const dialog = ref(false)
  // opt out of event
  const optOutOfEvent = () => {
    loading.value = true

    $fetch('/api/event/register', {
      method: 'DELETE',
      body: { eventUID: event.value.uid },
    })
      .then(() => refresh())
      .then(() =>
        useAlert.alert(
          getI18nString('alert.success.event.register.opt_out.name'),
          'success',
        ),
      )
      .catch((error) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage,
        )
        useAlert.alert(message, type as AlertType)
      })
      .finally(() => {
        loading.value = false
        dialog.value = false
      })
  }

  // opt out of Queue
  /*
  const optOutOfQueue = () => {
    loading.value = true

    $fetch('/api/event/register', {
      method: 'DELETE',
      body: { eventUID: event.value.uid },
    })
      .then(() => refresh())
      .then(() =>
        useAlert.alert(
          getI18nString('alert.success.event.register.opt_out_queue'),
          'success',
        ),
      )
      .catch((error) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage,
        )
        useAlert.alert(message, type as AlertType)
      })
      .finally(() => {
        loading.value = false
        dialog.value = false
      })
  }
  */

  // get user's position in the queue

  const userUid = useAuth.user?.uid

  const userQueuePosition = computed(() => {
    if (!event.value.queue) return null
    const queueEntries = Object.entries(event.value.queue)
    const sortedQueue = queueEntries.sort(([a], [b]) => a.localeCompare(b))
    if (!userUid) return null
    const userIndex = sortedQueue.findIndex(([, uid]) => uid === userUid)
    return userIndex !== -1 ? userIndex + 1 : null
  })

  const uidSvgUrl = ref('')

  onMounted(async () => {
    if (userUid) {
      const svg = await qrcode.toString(userUid, {
        type: 'svg',
        width: 200,
        margin: 1,
      })

      uidSvgUrl.value = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    }
  })
</script>

<template>
  <VContainer class="container">
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
      <VCardTitle class="description__title">{{ event?.title }}</VCardTitle>
      <!-- eslint-disable vue/no-v-text-v-html-on-component vue/no-v-html -->
      <VCardText class="description__text mb-3" v-html="event?.description" />
      <!-- eslint-enable -->
      <AttendantsList v-if="hasAttendants" :user-list="attendants" />
    </VCard>

    <!-- event details -->
    <VCard class="details elevation-4" rounded="lg">
      <!-- edit event -->
      <VBtn
        v-if="isAdmin"
        class="edit-event"
        variant="text"
        icon="mdi-pencil"
        size="small"
        color="primary"
        @click="() => navigateTo(localePath(`/event/edit/${event.uid}`))"
      />

      <VCardTitle class="details__title">
        {{ $t('event.page.details.name') }}
      </VCardTitle>

      <VCardText class="details__from pt-2 pb-0">
        <strong>{{ $t('event.page.details.from') }}:</strong>
        {{ eventStartString }}
      </VCardText>

      <VCardText class="details__to py-0 pb-5">
        <strong>{{ $t('event.page.details.to') }}:</strong>
        {{ eventEndString }}
      </VCardText>

      <VCardText
        v-if="registrationStartString"
        class="details__from py-0 pb-0 d-flex flex-wrap"
      >
        <strong class="mr-2">{{ $t('event.page.details.reg_start') }}: </strong>
        <span>{{ registrationStartString }}</span>
      </VCardText>

      <VCardText
        v-if="registrationEndString"
        class="details__to py-0 pb-5 d-flex flex-wrap"
      >
        <strong class="mr-2">{{ $t('event.page.details.reg_end') }}: </strong>
        <span>{{ registrationEndString }}</span>
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
      <VCard class="attendants elevation-4" color="primary" rounded="lg">
        <VCardTitle class="attendants__title">
          {{ $t('event.page.attendants.name') }}
        </VCardTitle>

        <VCardText
          v-if="hasCapacity"
          class="attendants__count d-flex justify-space-between flex-wrap"
        >
          <span>
            <strong>{{ $t('event.page.attendants.attendants') }}: </strong>

            <span v-if="hasAttendants">
              {{ Object.values(event.attendants).length }}
            </span>
            <span v-else>0</span>

            {{ event.capacity ? `/ ${event.capacity}` : '' }}

            <strong style="margin-left: 10px">
              {{ $t('event.page.queue.name') }}:
            </strong>

            {{ totalQueued }}
          </span>

          <span v-if="alreadyRegistered">
            {{ $t('event.page.attendants.registered') }}
            <VIcon style="margin-bottom: 2px">mdi-check-circle</VIcon>
          </span>

          <div v-if="alreadyQueued">
            {{ $t('event.page.queue.position') }}:
            {{ userQueuePosition }}
          </div>
        </VCardText>

        <VCardText v-else>
          {{ $t('event.page.attendants.nocapacity') }}
        </VCardText>

        <VCardText
          v-if="hasYearsRequirements"
          class="reg__year py-0 pb-5 d-flex flex-wrap"
        >
          <strong class="mr-2"
            >{{ $t('event.page.details.reg_year') }}:
          </strong>
          <span
            v-for="year in hasYearsRequirements"
            :key="year"
            class="comma-separated"
            >{{ year }}</span
          >
        </VCardText>

        <VCardText
          v-if="programmeRequirements"
          class="reg__programme py-0 pb-5 d-flex flex-wrap flex-column"
        >
          <strong class="mr-2"
            >{{ $t('event.page.details.reg_programme') }}:
          </strong>
          <VDivider />
          <ul class="ml-6 mt-2">
            <li
              v-for="programme in programmeRequirements"
              :key="programme"
              class="py-1 px-2"
            >
              {{ programme }}
            </li>
          </ul>
        </VCardText>
      </VCard>

      <!-- Event actions: Sign up perform action -->
      <VBtn
        v-if="!useAuth.isLoggedIn && hasCapacity && !eventFull"
        rounded="lg"
        variant="text"
        class="text-primary px-4 py-2 d-flex justify-center align-center login"
        prepend-icon="mdi-login"
        @click="navigateTo(localePath('/user/signin'))"
      >
        {{ $t('program.event.sign_in_to_register') }}
      </VBtn>

      <span v-if="alreadyRegistered" class="qr-wrapper">
        <img :src="uidSvgUrl" alt="QR code" />
      </span>

      <v-btn
        v-if="isAdmin"
        variant="tonal"
        append-icon="mdi-camera"
        :to="`${route.path}/scan_attendants`"
      >
        {{ $t('event.page.attendants.scan') }}
      </v-btn>

      <div
        v-if="hasEventActions && !showRegistrationAction"
        class="text-primary px-4 py-2 d-flex justify-center align-center"
      >
        <VIcon class="pr-3">mdi-calendar-clock</VIcon>
        {{ $t('program.event.registration_closed') }}
      </div>

      <!-- sign up options -->
      <div v-if="hasEventActions && showRegistrationAction">
        <!-- sign up -->
        <VBtn
          v-if="showSignupButton"
          color="success"
          :loading="loading"
          block
          variant="flat"
          :ripple="true"
          density="comfortable"
          :disabled="
            eventFull || !meetsProgrammeRequirement || !meetsYearRequirement
          "
          @click.stop="signUpForEvent"
        >
          {{ $t('program.event.sign_up') }}
        </VBtn>

        <!-- Enqueue -->
        <VBtn
          v-else-if="showQueueButton && !alreadyQueued"
          color="success"
          :loading="loading"
          block
          variant="flat"
          :ripple="true"
          density="comfortable"
          :disabled="
            alreadyQueued || !meetsProgrammeRequirement || !meetsYearRequirement
          "
          @click.stop="addToQueue"
        >
          {{ $t('program.event.enqueue') }}
        </VBtn>

        <!-- opt out modal -->
        <VDialog v-if="alreadyRegistered" v-model="dialog" width="500">
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              color="primary"
              block
              variant="tonal"
              :ripple="true"
              density="comfortable"
            >
              {{ $t('program.event.opt_out.name') }}
            </VBtn>
          </template>
          <template #default="{ isActive }">
            <VCard rounded="lg" class="text-center pa-6">
              <h6>{{ $t('program.event.opt_out.confirmtext') }}</h6>
              <div
                class="d-flex justify-center flex-wrap mt-6"
                style="gap: 1.5rem"
              >
                <VBtn
                  size="large"
                  variant="outlined"
                  color="primary"
                  :loading="loading"
                  @click="optOutOfEvent"
                >
                  {{ $t('program.event.opt_out.confirm') }}
                </VBtn>
                <VBtn
                  size="large"
                  flat
                  color="success"
                  @click="isActive.value = false"
                >
                  {{ $t('program.event.opt_out.abort') }}
                </VBtn>
              </div>
            </VCard>
          </template>
        </VDialog>

        <!-- opt out modal -->
        <VDialog
          v-if="!alreadyRegistered && alreadyQueued"
          v-model="dialog"
          width="500"
        >
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              color="primary"
              block
              variant="tonal"
              :ripple="true"
              density="comfortable"
            >
              {{ $t('program.event.opt_out.queue') }}
            </VBtn>
          </template>

          <template #default="{ isActive }">
            <VCard rounded="lg" class="text-center pa-6">
              <h6>{{ $t('program.event.opt_out.confirmtext') }}</h6>

              <div
                class="d-flex justify-center flex-wrap mt-6"
                style="gap: 1.5rem"
              >
                <VBtn
                  size="large"
                  variant="outlined"
                  color="primary"
                  :loading="loading"
                  @click="optOutOfEvent"
                >
                  {{ $t('program.event.opt_out.confirm') }}
                </VBtn>
                <VBtn
                  size="large"
                  flat
                  color="success"
                  @click="isActive.value = false"
                >
                  {{ $t('program.event.opt_out.abort') }}
                </VBtn>
              </div>
            </VCard>
          </template>
        </VDialog>
      </div>
    </div>
  </VContainer>
</template>

<style scoped lang="scss">
  @use 'sass:map';
  @use 'vuetify/settings';

  .comma-separated {
    &::after {
      content: ',\00a0';
    }
    &:last-child::after {
      content: '' !important;
    }
  }

  .login {
    font-size: 1rem;
  }
  .container {
    display: grid;
    width: 100vw;
    grid-template-columns: 1.1fr 3fr;
    gap: 1rem;
    grid-template-areas: 'details image' 'attendants description';

    .image-container {
      max-height: 300px;

      .image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .description {
      grid-area: description;

      :deep(li) {
        list-style-position: inside;

        p {
          display: inline;
        }
      }

      :deep(h5) {
        font-size: 1.15rem !important;
      }

      :deep(h6) {
        font-size: 1.05rem !important;
      }

      &__text {
        white-space: pre-line;
      }
    }
    .details {
      grid-area: details;

      .edit-event {
        position: absolute;
        right: 0.5rem;
        top: 0.5rem;
      }
    }

    .attendant-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .attendants {
      grid-area: attendants;
    }

    .qr-wrapper {
      display: flex;
      justify-content: center;
    }

    @media #{map.get(settings.$display-breakpoints, 'lg-and-up')} {
      max-width: 1080px;
    }

    @media #{map.get(settings.$display-breakpoints, 'md-and-down')} {
      max-width: 750px;
      grid-template-areas: 'image' 'details' 'attendants' 'description';
      grid-template-columns: 1fr;
    }

    @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
      max-width: 420px;
    }
  }
</style>
