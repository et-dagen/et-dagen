<script setup lang="ts">
  const formInput = ref({
    name: null,
    email: null,
    password: null,
    studyProgram: null,
    currentYear: null,
    userType: 'student',
    registrationCode: null,
  })

  const signUp = async () => {
    await registerUser({
      email: 'test@et-dagen.no',
      password: '123456',
      studyProgram: 'Elektronisk systemdesign og innovasjon',
      name: 'Test User',
    })
  }
</script>

<template>
  <VForm @submit.prevent="signUp">
    <VContainer>
      <VRow>
        <UserTextInput
          v-model="formInput.name"
          :content="{
            label: $t('user.register.name'),
          }"
        />
      </VRow>
      <VRow>
        <!-- TODO: Input UserPasswordInput from #78 -->
        <input
          v-model="formInput.password"
          type="password"
          :placeholder="$t('user.register.password')"
        />
      </VRow>
      <VRow>
        <!-- TODO: Input UserPasswordInput from 
          #78 with password confirm logic -->
        <input
          type="password"
          :placeholder="$t('user.register.password_confirmation')"
        />
      </VRow>
    </VContainer>
    <VContainer>
      <VTabs v-model="formInput.userType" bg-color="primary" fixed-tabs>
        <VTab value="student">{{ $t('user.register.user_type.student') }}</VTab>
        <VTab value="company">{{ $t('user.register.user_type.company') }}</VTab>
      </VTabs>
      <VCardText>
        <VWindow v-model="formInput.userType">
          <VWindowItem value="student">
            <UserSelectInput
              v-model="formInput.studyProgram"
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
            />
            <UserSelectInput
              v-model="formInput.currentYear"
              :content="{
                label: $t('user.register.year'),
                options: [1, 2, 3, 4, 5],
              }"
            />
          </VWindowItem>

          <VWindowItem value="company">
            <UserTextInput
              :content="{
                label: $t('user.register.registration_code'),
                hint: 'Koden skal være tilsendt av en administrator',
              }"
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
