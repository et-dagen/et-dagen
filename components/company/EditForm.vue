<script setup lang="ts">
  import type { AlertType } from 'composables/useAlerts'
  const props = defineProps({
    companyUid: {
      type: String,
      required: false,
      default: null,
    },
  })
  // Fetch company data if props are provided
  const auth = useAuthStore()
  const { hasAccess, user } = storeToRefs(auth)

  // fetch company data
  const { data: company } = await useFetch('/api/company', {
    method: 'GET',
    query: {
      companyUID: props.companyUid,
    },
  })

  const localePath = useLocalePath()
  // redirect on non existing company or lacking access
  if (
    (props.companyUid && !company.value) ||
    (hasAccess(['company']) &&
      props.companyUid &&
      props.companyUid !== user?.companyUID)
  )
    navigateTo(localePath('/company/edit'))

  const initialState = {
    name: null,
    description: null,
    type: null,
    webpage: null,
    logo: null,
    uid: null,
  }

  // Set state to company data if data fetched successfully
  const state = reactive(
    props.companyUid && company.value
      ? { ...Object.values(embedKeyIntoObjectValues(company.value))[0] }
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

  // Show appropriate success alert after signing up for company
  const displaySuccessAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'success'
    alertState.show = true
  }

  // show appropriate error alert after signing up for company
  const displayErrorAlert = (alertRoute: string) => {
    alertState.alertRoute = alertRoute
    alertState.type = 'error'
    alertState.show = true
  }

  // Show appropriate error alert for failed API calls
  const displayErrorAlertFromMessage = (errorMessage: string) => {
    const content = getAlertContent(errorMessage)
    alertState.alertRoute = content.alertRoute
    alertState.type = content.type
    alertState.show = content.show
  }

  const form = ref()
  const file = ref()

  // Boolean control states
  const editMode = computed(() => !!state.uid || !!state.companyUID)

  // update ref on input change
  const setLogo = (event) => {
    file.value = event.target.files[0]
  }

  // update logo
  const updateLogo = async () => {
    if (!file.value || !state.uid) return

    // creating multipart form data
    const formData = new FormData()
    formData.append('file', file.value)
    formData.append('companyUID', state.uid)

    // posting image to storage bucket
    await $fetch('/api/company/logo', {
      method: 'POST',
      body: formData,
    })
      .then(async ({ URL }) => {
        // catch url in response and update company logo
        await $fetch('/api/company', {
          method: 'PUT',
          body: {
            companyUID: state.uid,
            logo: URL,
          },
        })
          .then(() => {
            displaySuccessAlert('alert.success.company.edit.modified')
            setTimeout(() => navigateTo(localePath('/admin/companies')), 2000)
          })
          .catch(() =>
            displayErrorAlert('alert.error.company.edit.modified_logo')
          )
      })
      .catch(() => displayErrorAlert('alert.error.company.edit.modified'))
  }

  // remove logo from company
  const deleteLogo = async () => {
    await $fetch('/api/company', {
      method: 'PUT',
      body: {
        logo: null,
        companyUID: state.uid,
      },
    })
      .then(() => {
        displaySuccessAlert('alert.success.company.edit.deleted_logo')
        setTimeout(() => navigateTo(localePath('/admin/companies')), 2000)
      })
      .catch(() => displayErrorAlert('alert.error.company.edit.deleted_logo'))
  }

  // save changes to existing company
  const saveChanges = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    state.companyUID = state.uid

    // update company
    await $fetch('/api/company', {
      method: 'PUT',
      body: state,
    })
      .then(() => {
        displaySuccessAlert('alert.success.company.edit.modified')
        setTimeout(() => navigateTo(localePath('/admin/companies')), 2000)
      })
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }

  const createEvent = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      displayErrorAlert('alert.error.form.invalid')
      return
    }

    state.companyUID = state.uid

    // create company
    await $fetch('/api/company', {
      method: 'POST',
      body: state,
    })
      .then(() => updateLogo()) // add logo newly created company if provided
      .then(() => {
        displaySuccessAlert('alert.success.company.edit.created')
        setTimeout(() => navigateTo(localePath('/admin/companies')), 2000)
      })
      .catch((error) => displayErrorAlertFromMessage(error.statusMessage))
  }
</script>

<template>
  <!-- Header -->
  <h3 v-if="editMode" class="title py-6 mt-4">
    {{ $t('edit.company.edit.title') }}
  </h3>
  <h3 v-else class="title py-6 mt-4">
    {{ $t('edit.company.create.title') }}
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
      <!-- Name -->
      <VRow>
        <FormTextInput
          v-model="state.name"
          :content="{
            label: $t('edit.company.attributes.name'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- Description -->
      <VRow>
        <FormTextareaInput
          v-model="state.description"
          :content="{
            label: $t('edit.company.attributes.description'),
          }"
        />
      </VRow>

      <!-- Company Type -->
      <VRow>
        <FormSelectInput
          v-model="state.type"
          :content="{
            label: $t('edit.company.attributes.type.name'),
            options: [
              {
                title: $t('edit.company.attributes.type.main_partner'),
                value: 'main-partner',
              },
              {
                title: $t('edit.company.attributes.type.partner'),
                value: 'partner',
              },
              {
                title: $t('edit.company.attributes.type.sponsor'),
                value: 'sponsor',
              },
            ],
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- Website -->
      <VRow>
        <FormTextInput
          v-model="state.webpage"
          :content="{
            label: $t('edit.company.attributes.website'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>

      <!-- Logo -->
      <!-- TODO: #190 Add code for uploading image after company creation -->
      <VRow>
        <VCol :cols="state.logo ? 6 : 8">
          <FormFileInput
            :content="{
              label: $t('edit.company.attributes.logo'),
              icon: 'mdi-image',
              accept: ['image/png', 'image/jpeg'],
            }"
            :rules="[useRequiredInput]"
            @change="setLogo"
          />
        </VCol>
        <VCol v-if="state.logo" cols="2">
          <VTooltip location="top" color="primary">
            <!-- eslint-disable-next-line -->
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                variant="flat"
                block
                size="large"
                rounded="lg"
                color="error"
                icon="mdi-delete"
                @click="deleteLogo"
              ></VBtn>
            </template>

            {{ $t('edit.company.delete_logo') }}
          </VTooltip>
        </VCol>
        <VCol cols="4">
          <VBtn
            block
            height="56"
            variant="flat"
            color="success"
            @click="updateLogo"
            >{{ $t('edit.company.update_logo') }}</VBtn
          >
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
            @click="navigateTo(localePath('/admin/companies'))"
          >
            {{ $t('edit.company.cancel') }}
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
            {{ $t('edit.company.edit.action') }}
          </VBtn>
          <VBtn
            v-if="!editMode"
            block
            variant="flat"
            color="success"
            @click="createEvent"
          >
            {{ $t('edit.company.create.action') }}
          </VBtn>
        </VCol>
      </VRow>
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
