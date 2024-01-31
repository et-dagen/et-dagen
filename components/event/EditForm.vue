<script setup lang="ts">
  import type { AlertType } from 'composables/useAlerts'

  const localePath = useLocalePath()

  const props = defineProps({
    eventUid: {
      type: String,
      required: false,
      default: null,
    },
  })

  // Fetch event data if props are provided
  const { data: event } = await useAsyncData('event', async () => {
    if (!props.eventUid) return

    const data = await $fetch('/api/event', {
      query: { eventUID: props.eventUid },
    })

    return data
  })

  const { hasAccess, user } = useAuthStore()
  // Reroute to /event/edit if event does not exist
  // or if user does not have access to edit event
  if (
    (props.eventUid && !event.value) ||
    (hasAccess(['company']) &&
      props.eventUid &&
      event.value[props.eventUid]?.companyUID !== user?.companyUID)
  )
    navigateTo(localePath('/event/edit'))

  // Fetch all users
  // TODO: #188 Replace with API endpoint for getting only a sublist of known UIDs
  const { data: users } = await useFetch('/api/user', {
    query: { scope: 'all' },
  })
  const attendantList = computed(() => Object.entries(state.attendants))

  // Get user name by UID
  const getUserNameByUid = computed(() => (uid: string) => {
    return (
      users.value.find((user: any) => user.uid === uid)?.name ??
      'User not found'
    )
  })

  const { data: companies } = await useFetch('/api/company')
  // Format companies for select input
  const companyList = computed(() => {
    if (!hasAccess(['admin', 'company']) || !event) return null

    if (hasAccess(['admin'])) {
      const list = embedKeyIntoObjectValues(companies.value).map((company) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uid, name, ...remains } = company
        return {
          value: uid,
          title: name,
        }
      })

      // Add E&T-dagene as an option
      list.push({
        value: 'etdagene',
        title: 'E&T-dagene',
      })

      return list
    }

    if (hasAccess(['company'])) {
      return Object?.values(
        embedKeyIntoObjectValues(companies.value)
          .filter(({ uid }) => uid === user?.companyUID)
          .map((company) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { uid, name, ...remains } = company
            return {
              value: uid,
              title: name,
            }
          })
      )
    }
  })

  // Initial state in case of missing props or API bounce
  const initialState = {
    title: null,
    description: null,
    location: {
      name: null,
      map: null,
    },
    date: {
      start: null,
      end: null,
    },
    capacity: null,
    companyUID: null,
    attendants: null,
    uid: null,
  }

  // Set state to event data if data fetched successfully
  const state = reactive(
    event.value
      ? { ...Object.values(embedKeyIntoObjectValues(event.value))[0] }
      : { ...initialState }
  )

  // Alert state
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

  const displayErrorAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'error'
    alertState.show = true
  }

  // Show appropriate error alert for failed API calls
  const displayErrorAlertFromMessage = (
    errorType: string,
    errorMessage: string
  ) => {
    const content = getAlertContent(errorType, errorMessage)
    alertState.alertRoute = content.alertRoute
    alertState.type = content.type
    alertState.show = content.show
  }

  const form = ref()

  // Boolean control states
  const editMode = computed(() => !!state.uid || !!state.eventUID)
  const isLoadingAttendants = ref(false)
  const hasAttendants = computed(
    () => Object.hasOwn(state, 'attendants') && !!state.attendants
  )

  // Get updated event attendants
  const refreshAttendants = async () => {
    isLoadingAttendants.value = true
    const data = await $fetch('/api/event', {
      query: { eventUID: props.eventUid || state.uid },
    })
    if (!data) return

    // Only retain attendants
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { attendants, ...remains } = Object.values(data)[0]
    state.attendants = attendants

    isLoadingAttendants.value = false
  }

  // TODO: #184 Add code for removing user from event

  const removeFromEvent = async (userUID: string) => {
    await $fetch('/api/event/register', {
      method: 'DELETE',
      body: {
        eventUID: props.eventUid || state.uid,
        userUID,
      },
    })

    // Code for removing user
    refreshAttendants()
  }

  const handleEmptyStateValues = () => {
    state.capacity =
      state.capacity === undefined || Number(state.capacity) === 0
        ? null
        : Number(state.capacity)

    state.eventUID = state.uid

    state.location.map = state.location.map ? state.location.map : null
  }

  const routeOnSuccess = () => {
    const route = hasAccess(['admin']) ? '/admin/events' : '/company/admin'
    return navigateTo(localePath(route))
  }

  const saveChanges = async () => {
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    handleEmptyStateValues()
    await $fetch('/api/event', {
      method: 'PUT',
      body: state,
    })
      .then(() => {
        // Handle successful response
        displaySuccessAlert('alert.success.event.edit.modified')
        setTimeout(routeOnSuccess, 2000)
      })
      .catch((error) => {
        // Handle errors, including HTTP errors
        displayErrorAlertFromMessage('Event', error.statusMessage)
      })
  }

  const createEvent = async () => {
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    await $fetch('/api/event', {
      method: 'POST',
      body: state,
    })
      .then(() => {
        // Handle successful response
        displaySuccessAlert('alert.success.event.edit.created')
        setTimeout(routeOnSuccess, 2000)
      })
      .catch((error) => {
        // Handle errors, including HTTP errors
        displayErrorAlertFromMessage('Event', error.message)
      })
  }
</script>

<template>
  <!-- Header -->
  <h3 v-if="editMode" class="title py-6 mt-4">
    {{ $t('edit.event.edit.title') }}
  </h3>
  <h3 v-else class="title py-6 mt-4">
    {{ $t('edit.event.create.title') }}
  </h3>

  <!-- Alert component -->
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

  <!-- Edit Form -->
  <VForm ref="form" @submit.prevent="saveChanges || createEvent">
    <VContainer>
      <!-- Title -->
      <VRow>
        <FormTextInput
          v-model="state.title"
          :content="{
            label: $t('edit.event.attributes.title'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- Description -->
      <VRow>
        <FormTextareaInput
          v-model="state.description"
          :content="{
            label: $t('edit.event.attributes.description'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- Company -->
      <VRow>
        <FormSelectInput
          v-model="state.companyUID"
          :content="{
            label: $t('edit.event.attributes.company'),
            options: companyList,
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- Capacity -->
      <VRow>
        <FormNumberInput
          v-model="state.capacity"
          :content="{
            label: $t('edit.event.attributes.capacity'),
          }"
          clearable
        />
      </VRow>

      <!-- Datetime -->
      <VRow>
        <VCol>
          <FormDateTimeInput
            v-model="state.date.start"
            :content="{
              label: $t('edit.event.attributes.date.start'),
            }"
            :rules="[useRequiredInput]"
          />
        </VCol>
        <VCol>
          <FormDateTimeInput
            v-model="state.date.end"
            :content="{
              label: $t('edit.event.attributes.date.end'),
            }"
            :rules="[useRequiredInput]"
          />
        </VCol>
      </VRow>

      <!-- Location -->
      <VRow>
        <VCol>
          <FormTextInput
            v-model="state.location.name"
            :content="{
              label: $t('edit.event.attributes.location.name'),
            }"
            :rules="[useRequiredInput]"
          />
        </VCol>
        <VCol>
          <FormTextInput
            v-model="state.location.map"
            :content="{
              label: $t('edit.event.attributes.location.map'),
            }"
          />
        </VCol>
      </VRow>
    </VContainer>

    <!-- Actions -->
    <VContainer>
      <VRow justify="center">
        <VCol cols="6">
          <VBtn block variant="outlined" color="error" @click="$router.back()">
            {{ $t('edit.event.cancel') }}
          </VBtn>
        </VCol>
        <VCol cols="6">
          <VBtn
            v-if="editMode"
            block
            variant="flat"
            color="success"
            @click="saveChanges"
          >
            {{ $t('edit.event.edit.action') }}
          </VBtn>
          <VBtn
            v-if="!editMode"
            block
            variant="flat"
            color="success"
            @click="createEvent"
          >
            {{ $t('edit.event.create.action') }}
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Edit Attandant -->
    <VContainer>
      <VCard v-if="hasAttendants" class="mx-auto" max-width="800">
        <VCardTitle>
          {{ $t('edit.event.attributes.attendants') }}
          <VBtn
            icon="mdi-refresh"
            size="small"
            variant="plain"
            color="primary"
            :loading="isLoadingAttendants"
            @click="refreshAttendants"
          />
        </VCardTitle>

        <VDivider />

        <VVirtualScroll :items="attendantList" height="320" item-height="48">
          <template #default="{ item }">
            <VListItem
              :title="`${getUserNameByUid(item[1])}`"
              :subtitle="`UID: ${item[0]}`"
            >
              <template #prepend>
                <VIcon class="bg-primary">mdi-account</VIcon>
              </template>

              <template #append>
                <VBtn
                  icon="mdi-delete"
                  size="x-small"
                  variant="tonal"
                  color="error"
                  @click="removeFromEvent(item[1])"
                ></VBtn>
              </template>
            </VListItem>
          </template>
        </VVirtualScroll>
      </VCard>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @use 'vuetify/settings';

  .title {
    text-align: center;
  }

  .v-container {
    max-width: 50rem !important;
  }

  .v-row {
    padding-block: 0.6rem;
  }

  @media #{map-get(settings.$display-breakpoints, 'sm-and-down')} {
    .v-container {
      max-width: 26rem !important;
      margin-block: 0.5rem;
    }
  }
</style>
