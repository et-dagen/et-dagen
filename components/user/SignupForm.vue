<script setup lang="ts">
  import {
    useRequiredInput,
    useValidateEmail,
    useValidatePassword,
  } from '@/composables/useForm'

  const initialState = {
    firstName: '',
    lastName: '',
    email: '',
    password: null,
    studyProgram: null,
    currentYear: null,
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

    await registerUser({
      email: 'test@et-dagen.no',
      password: '123456',
      studyProgram: 'Elektronisk systemdesign og innovasjon',
      name: 'Test User',
    })
  }
</script>

<template>
  <VForm ref="form" @submit.prevent="submit">
    <VContainer>
      <VRow>
        <UserTextInput
          v-model="state.firstName"
          :content="{
            label: $t('user.register.first_name'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>
      <VRow>
        <UserTextInput
          v-model="state.lastName"
          :content="{
            label: $t('user.register.last_name'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>
      <VRow>
        <!-- TODO: Input UserEmailInput from #78 -->
        <input
          v-model="state.email"
          :placeholder="$t('user.register.email')"
          :rules="[useRequiredInput, useValidateEmail]"
        />
      </VRow>
      <VRow>
        <!-- TODO: Input UserPasswordInput from #78 -->
        <input
          v-model="state.password"
          type="password"
          :placeholder="$t('user.register.password')"
          :rules="[useRequiredInput, useValidatePassword]"
        />
      </VRow>
      <VRow>
        <!-- TODO: Input UserPasswordInput from 
          #78 with password confirm logic -->
        <input
          type="password"
          :placeholder="$t('user.register.password_confirmation')"
          :rules="[useRequiredInput, useValidatePassword]"
        />
      </VRow>
    </VContainer>
    <VContainer>
      <VTabs v-model="state.userType" bg-color="primary" fixed-tabs>
        <VTab value="student">{{ $t('user.register.user_type.student') }}</VTab>
        <VTab value="company">{{ $t('user.register.user_type.company') }}</VTab>
      </VTabs>
      <VCardText>
        <VWindow v-model="state.userType">
          <VWindowItem value="student">
            <UserSelectInput
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
            <UserSelectInput
              v-model="state.currentYear"
              :content="{
                label: $t('user.register.year'),
                options: [1, 2, 3, 4, 5],
              }"
              :rules="[state.userType === 'student' ? useRequiredInput : null]"
            />
          </VWindowItem>

          <VWindowItem value="company">
            <UserTextInput
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
      <VBtn color="success" type="submit">
        {{ $t('user.sign_up') }}
      </VBtn>
    </VContainer>
  </VForm>
</template>
