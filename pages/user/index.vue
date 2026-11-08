<script setup lang="ts">
  import DeleteAccount from '@/components/user/DeleteAccount.vue'
  import SignUps from '@/components/user/SignUps.vue'
  import Ticket from '@/components/user/Ticket.vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { useProgrammes } from '@/composables/useProgrammes'
  import { dietaryFlags } from '@/config/app.config'
  import { Instant } from '@/domain/time'
  import type { EventRow } from '@/lib/events'
  import { dietLabel } from '@/lib/forms/diet'
  import { signUpRows, ticketOf, type SignUp } from '@/lib/user/signUps'
  import { useAuthStore } from '@/stores/authStore'

  definePageMeta({
    // route is protected
    protected: true,
  })

  const auth = useAuthStore()
  const localePath = useLocalePath()
  const { t } = useI18n()

  const user = computed(() => auth.user)
  // a company contact has no study programme, year or CV
  const isCompany = computed(
    () => auth.currentSubject?.roles.includes('company') ?? false,
  )
  const { nameOf } = await useProgrammes()

  const restrictions = computed<string[]>(() =>
    Object.values(user.value?.dietaryRestrictions ?? {}),
  )
  // a restriction typed by hand has no icon of its own
  const dietaryIcon = (restriction: string) =>
    dietaryFlags.find((flag) => flag.name === restriction)?.icon ??
    'mdi-food-variant'

  const [
    { data: signUps, error: signUpsError, refresh: refreshSignUps },
    { data: events, error: eventsError, refresh: refreshEvents },
  ] = await Promise.all([
    useFetch<SignUp[]>('/api/v1/user/events', {
      key: 'user-sign-ups',
      headers: useRequestHeaders(['cookie']),
    }),
    useFetch<Record<string, EventRow>>('/api/v1/event'),
  ])

  const now = Instant.now()
  const rows = computed(() => signUpRows(signUps.value, events.value, now))
  const ticket = computed(() => ticketOf(rows.value))

  // a failed load must not tell someone at the door that they have no ticket
  const failed = computed(() => !!signUpsError.value || !!eventsError.value)
  const retrying = ref(false)
  const refresh = async () => {
    retrying.value = true
    await Promise.all([refreshSignUps(), refreshEvents()])
    retrying.value = false
  }

  const resumeFile = ref<File | File[] | null>(null)
  const uploadResume = async (chosen: File | File[] | null) => {
    const file = Array.isArray(chosen) ? chosen[0] : chosen
    if (!file || !auth.user) return
    const body = new FormData()
    body.append('file', file)
    body.append('userUID', auth.user.uid)
    try {
      const link = await $fetch<string>('/api/v1/resume', {
        method: 'POST',
        body,
      })
      auth.user = { ...auth.user, resume: link }
      notify(t('user.page.resume_uploaded'), 'success')
    } catch (error) {
      alertError(error)
    } finally {
      resumeFile.value = null
    }
  }

  const deleteResume = async () => {
    if (!auth.user) return
    try {
      await $fetch('/api/v1/resume', {
        method: 'DELETE',
        body: { userUID: auth.user.uid },
      })
      auth.user = { ...auth.user, resume: '' }
      notify(t('user.page.resume_deleted'), 'success')
    } catch (error) {
      alertError(error)
    }
  }

  const getFileName = (url: string) => url.split('/').pop()?.split('?')[0] ?? ''
</script>

<template>
  <VContainer class="d-flex justify-center align-center mt-16">
    <VCard class="pa-4" style="width: 800px; max-width: 90vw" elevation="4">
      <VRow class="d-flex justify-center h-100 ma-0">
        <VCol
          cols="12"
          lg="4"
          class="d-flex flex-column justify-between align-center"
        >
          <VIcon size="50" class="my-8" color="primary">mdi-account</VIcon>
          <h6>{{ user?.name }}</h6>
          <span class="text-neutral-lighten-2">{{ user?.email }}</span>
          <NuxtLink
            :to="localePath('/user/edit')"
            :aria-label="$t('edit.user.title')"
            class="mt-4"
          >
            <VIcon size="x-large" variant="plain" color="primary">
              mdi-pencil-box
            </VIcon>
          </NuxtLink>
        </VCol>
        <VCol v-if="!isCompany" cols="12" lg="8">
          <h6>{{ $t('user.information.title') }}</h6>
          <VDivider class="my-2" />
          <p class="my-2">
            <strong>{{ $t('user.information.studyprogramme') }}: </strong>
            {{ nameOf(user?.studyProgram) }}
          </p>
          <p class="my-2">
            <strong>{{ $t('user.information.currentyear') }}: </strong>
            {{ user?.currentYear }}
          </p>

          <div v-if="restrictions.length" class="mt-4">
            <p class="mb-2">
              <strong>
                {{ $t('user.information.dietaryrestrictions') }}:
              </strong>
            </p>
            <ul class="allergies d-flex flex-column">
              <li
                v-for="restriction in restrictions"
                :key="restriction"
                class="d-flex align-center"
              >
                <span>
                  <VIcon size="small" color="primary" class="mr-2">
                    {{ dietaryIcon(restriction) }}
                  </VIcon>
                  {{ dietLabel(restriction, t) }}
                </span>
              </li>
            </ul>
          </div>
          <div class="pt-5">
            <h6>{{ $t('user.resume.resume') }}</h6>
            <VDivider class="my-2" />
            <p v-if="user?.resume" class="my-2">
              <strong>{{ $t('user.resume.your_resume') }}: </strong>
              <a
                :href="`/api/v1/resume/file?userUID=${user.uid}`"
                target="_blank"
                rel="noopener"
                class="text-blue"
                >{{ getFileName(user.resume) }}</a
              >
            </p>
            <VRow no-gutters>
              <VCol cols="12" :sm="user?.resume ? 7 : 12">
                <VFileInput
                  v-model="resumeFile"
                  :active="!!user?.resume"
                  accept="application/pdf"
                  :label="$t('user.resume.upload_resume')"
                  base-color="standard"
                  color="standard"
                  @update:model-value="uploadResume"
                />
              </VCol>
              <VCol
                v-if="user?.resume"
                cols="12"
                sm="5"
                class="d-flex justify-center"
              >
                <VBtn color="error" @click="deleteResume">{{
                  $t('user.resume.delete_resume')
                }}</VBtn>
              </VCol>
            </VRow>
          </div>
        </VCol>
        <VCol cols="12">
          <h6>{{ $t('user.information.events') }}</h6>
          <VDivider class="my-2" />
          <VAlert
            v-if="failed"
            type="error"
            variant="tonal"
            class="my-2"
            :title="$t('user.page.load_failed')"
            :text="$t('user.page.load_failed_hint')"
          >
            <template #append>
              <VBtn
                size="small"
                variant="outlined"
                :loading="retrying"
                @click="refresh()"
              >
                {{ $t('user.page.retry') }}
              </VBtn>
            </template>
          </VAlert>
          <template v-else>
            <Ticket v-if="ticket && user" :row="ticket" :uid="user.uid" />
            <SignUps v-if="rows.length" :rows="rows" @withdrawn="refresh()" />
            <p v-else class="my-2">{{ $t('user.page.no_sign_ups') }}</p>
          </template>
        </VCol>
        <VCol cols="12">
          <DeleteAccount />
        </VCol>
      </VRow>
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
</style>
