<script setup lang="ts">
  import { CircleX, SquarePen, User } from '@lucide/vue'
  import { Card } from '@/components/ui/card'
  import { Separator } from '@/components/ui/separator'
  import DeleteAccount from '@/components/user/DeleteAccount.vue'
  import DietIcon from '@/components/user/DietIcon.vue'
  import FileField from '@/components/user/FileField.vue'
  import FormButton from '@/components/user/FormButton.vue'
  import SignUps from '@/components/user/SignUps.vue'
  import Ticket from '@/components/user/Ticket.vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { useProgrammes } from '@/composables/useProgrammes'
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
  const chosenName = computed(
    () =>
      (Array.isArray(resumeFile.value) ? resumeFile.value[0] : resumeFile.value)
        ?.name,
  )
  const uploadResume = async (chosen: File | File[] | null) => {
    const file = Array.isArray(chosen) ? chosen[0] : chosen
    if (!file || !auth.user) return
    resumeFile.value = file
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

  const H6 = 'tw:text-xl tw:leading-8 tw:font-medium tw:tracking-[0.0125em]'
  const DIVIDER =
    'tw:my-2 tw:bg-black/12 tw:data-[orientation=horizontal]:h-0.5'
</script>

<template>
  <div class="tw:mt-16 tw:flex tw:items-center tw:justify-center tw:p-4">
    <Card
      class="tw:block tw:w-[800px] tw:max-w-[90vw] tw:rounded tw:border-0 tw:p-4 tw:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2),0_4px_5px_0_rgba(0,0,0,0.14),0_1px_10px_0_rgba(0,0,0,0.12)]"
    >
      <div class="tw:flex tw:h-full tw:flex-wrap tw:justify-center">
        <div
          class="tw:flex tw:w-full tw:flex-col tw:items-center tw:justify-between tw:p-3 tw:min-[1280px]:w-1/3"
        >
          <User
            aria-hidden="true"
            class="tw:my-8 tw:size-[50px] tw:fill-current tw:text-brand"
          />
          <h6 :class="H6">{{ user?.name }}</h6>
          <span class="tw:text-[#949494]">{{ user?.email }}</span>
          <NuxtLink
            :to="localePath('/user/edit')"
            :aria-label="$t('edit.user.title')"
            class="tw:mt-4 tw:text-brand"
          >
            <SquarePen aria-hidden="true" class="tw:size-9" />
          </NuxtLink>
        </div>
        <div v-if="!isCompany" class="tw:w-full tw:p-3 tw:min-[1280px]:w-2/3">
          <h6 :class="H6">{{ $t('user.information.title') }}</h6>
          <Separator :class="DIVIDER" />
          <p class="tw:my-2">
            <strong>{{ $t('user.information.studyprogramme') }}: </strong>
            {{ nameOf(user?.studyProgram) }}
          </p>
          <p class="tw:my-2">
            <strong>{{ $t('user.information.currentyear') }}: </strong>
            {{ user?.currentYear }}
          </p>

          <div v-if="restrictions.length" class="tw:mt-4">
            <p class="tw:mb-2">
              <strong>
                {{ $t('user.information.dietaryrestrictions') }}:
              </strong>
            </p>
            <ul
              class="tw:flex tw:max-h-[150px] tw:flex-col tw:flex-wrap tw:gap-[5px] tw:overflow-y-auto"
            >
              <li
                v-for="restriction in restrictions"
                :key="restriction"
                class="tw:flex tw:w-1/2 tw:items-center"
              >
                <span class="tw:inline-flex tw:items-center">
                  <DietIcon
                    :restriction="restriction"
                    class="tw:mr-2 tw:size-5 tw:text-brand"
                  />
                  {{ dietLabel(restriction, t) }}
                </span>
              </li>
            </ul>
          </div>
          <div class="tw:pt-5">
            <h6 :class="H6">{{ $t('user.resume.resume') }}</h6>
            <Separator :class="DIVIDER" />
            <p v-if="user?.resume" class="tw:my-2">
              <strong>{{ $t('user.resume.your_resume') }}: </strong>
              <a
                :href="`/api/v1/resume/file?userUID=${user.uid}`"
                target="_blank"
                rel="noopener"
                class="tw:text-[#2196F3]"
                >{{ getFileName(user.resume) }}</a
              >
            </p>
            <div class="tw:flex tw:flex-wrap">
              <div
                :class="['tw:w-full', user?.resume && 'tw:min-[600px]:w-7/12']"
              >
                <FileField
                  accept="application/pdf"
                  :label="$t('user.resume.upload_resume')"
                  :active="!!user?.resume"
                  :file-name="chosenName"
                  @choose="uploadResume"
                />
              </div>
              <div
                v-if="user?.resume"
                class="tw:flex tw:w-full tw:justify-center tw:min-[600px]:w-5/12"
              >
                <FormButton tone="error" @click="deleteResume">
                  {{ $t('user.resume.delete_resume') }}
                </FormButton>
              </div>
            </div>
          </div>
        </div>
        <div class="tw:w-full tw:p-3">
          <h6 :class="H6">{{ $t('user.information.events') }}</h6>
          <Separator :class="DIVIDER" />
          <div
            v-if="failed"
            role="alert"
            class="tw:my-2 tw:flex tw:max-w-[600px] tw:items-start tw:gap-4 tw:rounded tw:bg-[#cc3000]/12 tw:p-4 tw:text-[#cc3000]"
          >
            <CircleX aria-hidden="true" class="tw:size-7 tw:shrink-0" />
            <div class="tw:flex-1">
              <p
                class="tw:text-xl tw:leading-7 tw:font-medium tw:tracking-[0.0125em]"
              >
                {{ $t('user.page.load_failed') }}
              </p>
              <p>{{ $t('user.page.load_failed_hint') }}</p>
            </div>
            <FormButton
              size="small"
              look="outlined"
              tone="error"
              :loading="retrying"
              @click="refresh()"
            >
              {{ $t('user.page.retry') }}
            </FormButton>
          </div>
          <template v-else>
            <Ticket v-if="ticket && user" :row="ticket" :uid="user.uid" />
            <SignUps v-if="rows.length" :rows="rows" @withdrawn="refresh()" />
            <p v-else class="tw:my-2">{{ $t('user.page.no_sign_ups') }}</p>
          </template>
        </div>
        <div class="tw:w-full tw:p-3">
          <DeleteAccount />
        </div>
      </div>
    </Card>
  </div>
</template>
