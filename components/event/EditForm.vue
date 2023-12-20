<script setup lang="ts">
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
  // Reroute to /event/edit if event does not exist
  if (props.eventUid && !event.value) navigateTo('/event/edit')

  // Fetch all users
  // TODO: Replace with API endpoint for getting only a sublist of known UIDs
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
  const companyList = computed(() =>
    Object?.values(
      embedKeyIntoObjectValues(companies.value).map((company) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uid, name, ...remains } = company
        return {
          value: uid,
          title: name,
        }
      })
    )
  )

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

  const form = ref()

  // Boolean control states
  const editMode = computed(() => !!state.uid)
  const isLoadingAttendants = ref(false)
  const hasAttendants = computed(
    () => Object.hasOwn(state, 'attendants') && !!state.attendants
  )

  // Get updated event attendants
  const refreshAttendants = async () => {
    isLoadingAttendants.value = true
    const data = await $fetch('/api/event', {
      query: { eventUID: props.eventUid },
    })
    if (!data) return

    // Only retain attendants
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { attendants, ...remains } = Object.values(data)[0]
    state.attendants = attendants

    isLoadingAttendants.value = false
  }

  // TODO: Implement code for removing user from event
  const removeFromEvent = (userUID: string) => {
    console.log('Removing user:', userUID)
    // Code for removing user
    refreshAttendants()
  }

  // Reroute to previous page
  const { history } = useRouter().options
  const goToPreviousPage = () => {
    history.go(-1)
  }

  // Post new or update previous event
  const submit = () => {
    // Code for processing data and posting to API

    // Reroute to previous page
    goToPreviousPage()
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

  <!-- Edit Form -->
  <VForm ref="form" @submit.prevent="submit">
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
        />
      </VRow>

      <!-- Datetime -->
      <VRow>
        <VCol>
          <FormTextInput
            v-model="state.date.start"
            :content="{
              label: $t('edit.event.attributes.date.start'),
            }"
            :rules="[useRequiredInput]"
          />
        </VCol>
        <VCol>
          <FormTextInput
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
            :rules="[useRequiredInput]"
          />
        </VCol>
      </VRow>
    </VContainer>

    <!-- Actions -->
    <VContainer>
      <VRow justify="center">
        <VCol cols="6">
          <VBtn
            block
            variant="outlined"
            color="error"
            @click="goToPreviousPage"
          >
            Cancel
          </VBtn>
        </VCol>
        <VCol cols="6">
          <VBtn block variant="flat" color="success" @click="submit">
            {{ editMode ? 'Save' : 'Create' }}
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
  @import 'vuetify/settings';

  .title {
    text-align: center;
  }

  .v-container {
    max-width: 50rem !important;
  }

  .v-row {
    padding-block: 0.6rem;
  }
</style>
