<script setup lang="ts">
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
  const useAlerts = useAlertStore()

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
    (hasAccess.value(['company']) &&
      props.companyUid &&
      props.companyUid !== user.value?.companyUID)
  )
    navigateTo(localePath('/company/edit'))

  const initialState = {
    name: null,
    description: null,
    type: null,
    webpage: null,
    cvAccess: false,
    logo: null,
    uid: null,
  }

  // Set state to company data if data fetched successfully
  const state = reactive(
    props.companyUid && company.value
      ? { ...Object.values(embedKeyIntoObjectValues(company.value))[0] }
      : { ...initialState },
  )

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
    formData.append('storagePath', `companies/${state.uid}`)

    // posting image to storage bucket
    await $fetch('/api/image', {
      method: 'POST',
      body: formData,
    })
      .then(({ URL }) => {
        state.logo = URL
      })
      .catch(() =>
        useAlerts.alert(
          getI18nString('alert.error.company.edit.modified'),
          'error',
        ),
      )
  }

  // save changes to existing company
  const saveChanges = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      useAlerts.alert(getI18nString('alert.error.form.invalid'), 'error')
      return
    }

    state.companyUID = state.uid

    await updateLogo()

    // eslint-disable-next-line
    const { uid, ...rest } = state
    // update company
    await $fetch('/api/company', {
      method: 'PUT',
      body: rest,
    })
      .then(() => {
        useAlerts.alert(
          getI18nString('alert.success.company.edit.modified'),
          'success',
        )
        setTimeout(() => navigateTo(localePath('/admin/companies')), 2000)
      })
      .catch((error) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage,
        )
        useAlerts.alert(message, type as AlertType)
        console.error(error)
      })
  }

  const createCompany = async () => {
    // throw error on invalid form
    const { valid } = await form.value.validate()
    try {
      if (!valid) throw new Error('Form is not valid')
    } catch (error) {
      useAlerts.alert(getI18nString('alert.error.form.invalid'), 'error')
      return
    }

    // create company
    await $fetch('/api/company', {
      method: 'POST',
      body: state,
    })
      .then(async (res) => {
        // get companuUID from server response
        state.uid = res.companyUID

        // update logo
        await updateLogo()

        // update company logo with UID
        // eslint-disable-next-line
        const { uid, logo, ...rest } = state
        await $fetch('/api/company', {
          method: 'PUT',
          body: { companyUID: uid, logo },
        })
      }) // add logo newly created company if provided
      .then(() => {
        useAlerts.alert(
          getI18nString('alert.success.company.edit.created'),
          'success',
        )
        setTimeout(() => navigateTo(localePath('/admin/companies')), 2000)
      })
      .catch((error) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage,
        )
        useAlerts.alert(message, type as AlertType)
        console.error(error)
      })
  }
</script>

<template>
  <div class="mx-auto" style="max-width: 95vw">
    <!-- Header -->
    <h3 v-if="editMode" class="title py-6 mt-4">
      {{ $t('edit.company.edit.title') }}
    </h3>
    <h3 v-else class="title py-6 mt-4">
      {{ $t('edit.company.create.title') }}
    </h3>

    <!-- Edit Form -->
    <VForm ref="form" @submit.prevent="saveChanges || createCompany">
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
                {
                  title: $t('edit.company.attributes.type.old'),
                  value: 'old',
                },
              ],
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- Webpage -->
        <VRow>
          <FormTextInput
            v-model="state.webpage"
            :content="{
              label: $t('edit.company.attributes.webpage'),
            }"
            :rules="[useRequiredInput]"
          />
        </VRow>

        <!-- CV Access -->
        <VRow>
          <FormSelectInput
            v-model="state.cvAccess"
            :content="{
              label: $t('edit.company.attributes.cvAccess.name'),
              options: [
                {
                  title: $t('edit.company.attributes.cvAccess.yes'),
                  value: true,
                },
                {
                  title: $t('edit.company.attributes.cvAccess.no'),
                  value: false,
                },
              ],
            }"
            :rules="[]"
          />
        </VRow>

        <!-- Logo -->
        <!-- TODO: #190 Add code for uploading image after company creation -->
        <VRow style="overflow: scroll">
          <VCol :cols="state.logo ? 9 : 12">
            <FormFileInput
              :content="{
                label: state.logo
                  ? `${state.logo.split('/').pop()}`
                  : $t('edit.company.attributes.logo'),
                icon: 'mdi-image',
                accept: ['image/png', 'image/jpeg'],
              }"
              :rules="[useRequiredInput]"
              clearable
              @change="setLogo"
            />
          </VCol>
          <VCol v-if="state.logo && user?.userType === 'admin'" cols="3">
            <VBtn
              variant="outlined"
              block
              height="56"
              color="warning"
              style="min-width: fit-content"
              @click="state.logo = null"
            >
              {{ $t('edit.company.unlink_logo') }}
            </VBtn>
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
              @click="createCompany"
            >
              {{ $t('edit.company.create.action') }}
            </VBtn>
          </VCol>
        </VRow>
      </VContainer>
    </VForm>
  </div>
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
</style>
