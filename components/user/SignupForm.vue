<script setup lang="ts">
  import {
    useRequiredInput,
    useValidateEmail,
    useValidatePassword,
    useRequireEqualPasswords,
  } from '@/composables/useForm'

  import type { AlertType } from 'composables/useAlerts'

  const { data: studyProgrammes } = await useFetch('/api/programme')
  const yearOptions = computed(() => {
    return (studyProgram: string) => {
      const programme = studyProgrammes.value.find(
        (prog: any) => prog.name === studyProgram
      )

      if (!programme || programme.type === 'integrated') return [1, 2, 3, 4, 5]

      switch (programme.type) {
        case 'bachelor':
          return [1, 2, 3]
        case 'master':
          return [4, 5]
        default:
          return []
      }
    }
  })

  const initialState = {
    name: '',
    email: '',
    password: '',
    passwordConfirmation: null,
    studyProgram: '',
    currentYear: '',
    userType: null,
    registrationCode: null,
  }

  const state = reactive({
    ...initialState,
  })

  // Reset currentYear if programme doesn't have that year
  watch(
    () => state.studyProgram,
    (program) => {
      if (!yearOptions.value(program).includes(Number(state.currentYear)))
        state.currentYear = ''
    }
  )

  const form = ref()
  const isRegistering = ref<boolean>(false)
  const submit = async () => {
    if (!form.value) return

    const { valid } = await form.value.validate()
    if (!valid) throw new Error('Form is not valid')

    isRegistering.value = true

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordConfirmation, userType, ...user } = state

    await registerUser(
      {
        name: user.name,
        email: user.email,
        password: user.password,
        studyProgram: userType === 'student' ? user.studyProgram : undefined,
        currentYear:
          userType === 'student' ? Number(user.currentYear) : undefined,
      },
      user.registrationCode ?? undefined // Only send registration code if user is a company
    )
      .catch((error) => {
        const content = getAlertRouteAndType(error.message)

        alertState.alertRoute = content.route
        alertState.type = content.type as AlertType
        alertState.show = true

        console.error(error)
      })
      .finally(() => {
        isRegistering.value = false
      })
  }

  const initialAlertState = {
    show: false,
    alertRoute: '',
    type: undefined as AlertType,
  }

  const alertState = reactive({
    ...initialAlertState,
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
  <VForm ref="form" @submit.prevent="submit">
    <VContainer>
      <VRow>
        <UserFormTextInput
          v-model="state.name"
          :content="{
            label: $t('user.register.full_name'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>
      <VRow>
        <UserFormEmailInput
          v-model="state.email"
          :rules="[useRequiredInput, useValidateEmail]"
        />
      </VRow>
      <VRow>
        <UserFormPasswordInput
          v-model="state.password"
          :rules="[useRequiredInput, useValidatePassword]"
        />
      </VRow>
      <VRow>
        <UserFormPasswordInput
          v-model="state.passwordConfirmation"
          :rules="[
            useRequiredInput,
            useRequireEqualPasswords(
              state.password,
              state.passwordConfirmation
            ),
          ]"
          confirm-password
        />
      </VRow>
    </VContainer>
    <VContainer class="px-0">
      <VTabs v-model="state.userType" fixed-tabs color="primary" class="tabs">
        <VTab value="student">{{ $t('user.register.user_type.student') }}</VTab>
        <VTab value="company">{{ $t('user.register.user_type.company') }}</VTab>
      </VTabs>
      <VCardText class="px-0">
        <VWindow v-model="state.userType">
          <VWindowItem value="student">
            <UserFormSelectInput
              v-model="state.studyProgram"
              :content="{
                label: $t('user.register.study_program'),
                // eslint-disable-next-line vue/max-len
                options: Object.values(studyProgrammes).map((prog: any) => prog.name),
              }"
              :rules="[state.userType === 'student' ? useRequiredInput : null]"
            />
            <UserFormSelectInput
              v-model="state.currentYear"
              :content="{
                label: $t('user.register.year'),
                options: yearOptions(state.studyProgram),
              }"
              :rules="[state.userType === 'student' ? useRequiredInput : null]"
            />
          </VWindowItem>

          <VWindowItem value="company">
            <UserFormTextInput
              v-model="state.registrationCode"
              :content="{
                label: $t('user.register.registration_code'),
                hint: $t('user.register.code_hint'),
              }"
              :rules="[state.userType === 'company' ? useRequiredInput : null]"
            />
          </VWindowItem>
        </VWindow>
      </VCardText>
      <VBtn
        color="success"
        type="submit"
        class="btn--submit"
        :loading="isRegistering"
      >
        {{ $t('user.sign_up') }}
      </VBtn>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';

  .v-container {
    max-width: 26rem !important;
  }

  .v-row {
    padding-block: 0.6rem;
  }

  .v-tab--selected {
    background: rgba(var(--v-theme-accent), 0.08);
  }

  .v-window__container {
    div {
      padding-block: 0.6rem;
    }
  }

  .btn--submit {
    width: 60%;
    margin-inline: 20% !important;
  }

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    .v-tab {
      font-size: 1rem;
    }

    .btn--submit {
      width: 100%;
      margin: 0 !important;
    }
  }
</style>
