<script setup lang="ts">
  import { dietaryFlags } from '~/config/app.config'

  definePageMeta({
    // route is protected
    protected: true,
  })

  const dietaryIcon = computed(() => {
    return (restriction: string) => {
      return dietaryFlags.find((flag) => flag.name === restriction)?.icon
    }
  })

  const auth = useAuthStore()
  const useAlerts = useAlertStore()

  const localePath = useLocalePath()
  const isRegisteredRestriction = computed(() => {
    return (restriction: string) => {
      return Object.values(dietaryFlags)
        .map((entry) => entry.name)
        .includes(restriction)
    }
  })

  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const { data } = await useFetch('/api/event')

  // embed uid into object
  const events = computed(() => embedKeyIntoObjectValues(data.value))

  // return list of the events the user is signed up for
  const userEvents = computed(() => {
    if (!events.value) return []

    const filteredEvents = events.value.filter((event: any) =>
      Object.values(event?.attendants ?? {}).includes(user.value?.uid)
    )

    return filteredEvents.map((event: any) => {
      return {
        title: event.title,
        uid: event.uid,
      }
    })
  })

  const isSelectingFile = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const handleFileInput = () => {
    isSelectingFile.value = true

    // After obtaining the focus when closing the FilePicker, return the button state to normal
    window.addEventListener(
      'focus',
      () => {
        isSelectingFile.value = false
      },
      { once: true }
    )

    // Trigger click on the FileInput
    fileInput?.value?.click()
  }

  const uploadResume = async (event: any) => {
    const resumeFile = event.target.files[0]
    if (!resumeFile) return

    const bodyData = new FormData()
    bodyData.append('file', resumeFile)
    bodyData.append('userUID', auth.user?.uid)

    await useFetch('/api/resume', {
      method: 'POST',
      body: bodyData,
    })
      .then(() => {
        useAlerts.alert(
          getI18nString('alert.success.user.resume.updated'),
          'success'
        )
        setTimeout(() => location.reload(), 1000)
      })
      .catch((error) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage
        )
        useAlerts.alert(message, type as AlertType)
        console.error(error)
      })
  }

  const deleteResume = async () => {
    await useFetch('/api/resume', {
      method: 'DELETE',
      body: {
        userUID: auth.user?.uid,
      },
    })
      .then(() => {
        useAlerts.alert(
          getI18nString('alert.success.user.resume.deleted'),
          'success'
        )
        setTimeout(() => location.reload(), 1000)
      })
      .catch((error) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage
        )
        useAlerts.alert(message, type as AlertType)
        console.error(error)
      })
  }

  const getFileName = (URL: string) => {
    const list = URL.split('/')
    return list[list.length - 1]
  }
</script>

<template>
  <VContainer class="d-flex justify-center flex-wrap mt-16" style="gap: 16px">
    <VCard class="pa-4" style="width: 700px; max-width: 90vw" elevation="4">
      <VRow class="d-flex justify-center h-100 ma-0">
        <VCol
          cols="12"
          lg="4"
          class="d-flex flex-column justify-between align-center"
        >
          <VIcon size="50" class="my-8" color="primary">mdi-account</VIcon>
          <h6>{{ user?.name }}</h6>
          <span class="text-neutral-lighten-2">{{ user?.email }}</span>
          <NuxtLink :to="localePath('/user/edit')" class="mt-4">
            <VIcon size="x-large" variant="plain" color="primary">
              mdi-pencil-box
            </VIcon>
          </NuxtLink>
        </VCol>
        <VCol v-if="!auth.hasAccess(['company'])" cols="12" lg="8">
          <h6>{{ $t('user.information.title') }}</h6>
          <VDivider class="my-2" />
          <p class="my-2">
            <strong>{{ $t('user.information.studyprogramme') }}: </strong>
            {{ user?.studyProgram }}
          </p>
          <p class="my-2">
            <strong>{{ $t('user.information.currentyear') }}: </strong>
            {{ user?.currentYear }}
          </p>

          <div v-if="user?.dietaryRestrictions" class="mt-4">
            <p class="mb-2">
              <strong>
                {{ $t('user.information.dietaryrestrictions') }}:
              </strong>
            </p>
            <ul class="allergies d-flex flex-column">
              <li
                v-for="restriction in user?.dietaryRestrictions"
                :key="restriction"
                class="d-flex align-center"
              >
                <span v-if="isRegisteredRestriction(restriction)">
                  <VIcon size="small" color="primary" class="mr-2">
                    {{ dietaryIcon(restriction) }}
                  </VIcon>
                  {{ $t(`dietary_restrictions.${restriction}`) }}
                </span>

                <span v-else>
                  <VIcon size="small" color="primary" class="mr-2">
                    mdi-food-variant
                  </VIcon>
                  {{ restriction }}
                </span>
              </li>
            </ul>
          </div>
          <div class="pt-5">
            <h6>{{ $t('user.resume.resume') }}</h6>
            <VDivider class="my-2" />
            <p v-if="auth.user?.resume" class="my-2">
              <strong>{{ $t('user.resume.my_resume') }}: </strong>
              <NuxtLink
                :to="auth.user?.resume"
                :external="true"
                target="_blank"
                class="text-blue"
                >{{ getFileName(auth.user?.resume) }}</NuxtLink
              >
            </p>
            <VRow no-gutters>
              <VCol cols="12" :sm="auth.user?.resume !== undefined ? 6 : 12">
                <VFileInput
                  ref="fileInput"
                  class="d-none"
                  :active="auth.user?.resume !== undefined"
                  accept="application/pdf"
                  :label="$t('user.resume.upload_resume')"
                  base-color="standard"
                  color="standard"
                  @change="uploadResume"
                />
                <VBtn
                  color="success"
                  prepend-icon="mdi-upload"
                  variant="text"
                  block
                  @click="handleFileInput"
                >
                  {{
                    auth.user?.resume === undefined
                      ? $t('user.resume.upload_resume')
                      : $t('user.resume.update_resume')
                  }}
                </VBtn>
              </VCol>
              <VCol
                v-if="auth.user?.resume"
                cols="12"
                sm="6"
                class="d-flex justify-center"
              >
                <VBtn
                  color="error"
                  prepend-icon="mdi-delete"
                  block
                  class="ml-sm-6"
                  @click="deleteResume"
                >
                  {{ $t('user.resume.delete_resume') }}
                </VBtn>
              </VCol>
            </VRow>
          </div>
        </VCol>
      </VRow>
    </VCard>

    <!-- list of user events -->
    <VCard
      v-if="userEvents.length"
      color="primary"
      class="align-self-stretch pa-7"
      style="width: 350px; max-width: 90vw; min-height: 200px !important"
      elevation="4"
    >
      <h6>{{ $t('user.information.events') }}</h6>
      <VDivider class="mt-2" />

      <VCardText>
        <ul class="text-body-1">
          <li v-for="event in userEvents" :key="event.uid">
            <NuxtLink :to="localePath(`/event/${event.uid}`)">
              {{ event.title }}
            </NuxtLink>
          </li>
        </ul>
      </VCardText>
    </VCard>
  </VContainer>
</template>

<style scoped lang="scss">
  .allergies {
    flex-wrap: wrap;
    list-style: none;
    max-height: 150px;
    gap: 5px;
    overflow-y: auto;

    li {
      width: 50%;
    }
  }

  a {
    text-decoration: underline;
  }

  a:hover {
    text-decoration: none;
  }
</style>
