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
  <v-form>
    <v-container>
      <v-row>
        <UserTextInput
          v-model="formInput.name"
          :content="{
            label: $t('user.register.name'),
          }"
        />
      </v-row>
      <v-row>
        <!-- TODO: Input UserPasswordInput from #78 -->
        <input
          v-model="formInput.password"
          type="password"
          :placeholder="$t('user.register.password')"
        />
      </v-row>
      <v-row>
        <!-- TODO: Input UserPasswordInput from 
          #78 with password confirm logic -->
        <input
          type="password"
          :placeholder="$t('user.register.password_confirmation')"
        />
      </v-row>
    </v-container>
    <v-container>
      <v-tabs v-model="formInput.userType" bg-color="primary">
        <v-tab value="student">{{
          $t('user.register.user_type.student')
        }}</v-tab>
        <v-tab value="company">{{
          $t('user.register.user_type.company')
        }}</v-tab>
      </v-tabs>
      <v-card-text>
        <v-window v-model="formInput.userType">
          <v-window-item value="student">
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
          </v-window-item>

          <v-window-item value="company">
            <UserTextInput
              :content="{
                label: $t('user.register.registration_code'),
                hint: 'Koden skal være tilsendt av en administrator',
              }"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
      <VBtn color="success" @click="signUp">
        {{ $t('user.sign_up') }}
      </VBtn>
    </v-container>
  </v-form>
</template>
