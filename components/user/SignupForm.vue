<script setup lang="ts">
  import {
    useRequiredInput,
    useValidateEmail,
    useValidatePassword,
    useRequireEqualPasswords,
  } from '@/composables/useForm'

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

  const form = ref()
  const submit = async () => {
    if (!form.value) return
    const { valid } = await form.value.validate()

    if (!valid) throw new Error('Form is not valid')

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordConfirmation, userType, ...user } = state

    if (userType === 'student') {
      await registerUser({
        name: user.name,
        email: user.email,
        password: user.password,
        studyProgram: user.studyProgram,
        currentYear: user.currentYear,
      })
    }

    if (userType === 'company') {
      await registerUser(
        {
          name: user.name,
          email: user.email,
          password: user.password,
        },
        user.registrationCode
      )
    }
  }
</script>

<template>
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
        <!-- TODO: Input FormPasswordInput from #78 -->
        <UserFormPasswordInput
          v-model="state.password"
          :rules="[useRequiredInput, useValidatePassword]"
        />
      </VRow>
      <VRow>
        <!-- TODO: Input FormPasswordInput from 
          #78 with password confirm logic -->
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
      <!-- TODO: Set background color of active tab to primary with less opacity -->
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
                options: [
                  'Data',
                  'Elektro',
                  'Bygg',
                  'Maskin',
                  'Kjemi',
                  'Annen',
                ],
              }"
              :rules="[state.userType === 'student' ? useRequiredInput : null]"
            />
            <UserFormSelectInput
              v-model="state.currentYear"
              :content="{
                label: $t('user.register.year'),
                options: [1, 2, 3, 4, 5],
              }"
              :rules="[state.userType === 'student' ? useRequiredInput : null]"
            />
          </VWindowItem>

          <VWindowItem value="company">
            <UserFormTextInput
              v-model="state.registrationCode"
              :content="{
                label: $t('user.register.registration_code'),
                hint: 'Koden skal være tilsendt av en administrator',
              }"
              :rules="[state.userType === 'company' ? useRequiredInput : null]"
            />
          </VWindowItem>
        </VWindow>
      </VCardText>
      <VBtn color="success" type="submit" class="btn--submit">
        {{ $t('user.sign_up') }}
      </VBtn>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';

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
