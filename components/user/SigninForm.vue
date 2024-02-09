<script setup lang="ts">
  const localePath = useLocalePath()
  const useAlerts = useAlertStore()

  const initialState = {
    email: '',
    password: '',
  }

  const state = reactive({
    ...initialState,
  })

  const isRegistering = ref<boolean>(false)

  const form = ref()
  const submit = () => {
    isRegistering.value = true
    signinUser(state.email, state.password)
      .catch((error) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage
        )
        useAlerts.alert(message, type as AlertType)
        console.error(error)
      })
      .finally(() => {
        isRegistering.value = false
      })
  }

  const resetPassword = () => {
    if (!state.email) {
      useAlerts.alert(getI18nString('alert.error.form.missing_email'), 'error')
      return
    }

    requestPasswordReset(state.email)
      .then(() =>
        useAlerts.alert(
          getI18nString('alert.success.firebase.reset_password'),
          'success'
        )
      )
      .catch((error) => {
        const { type, message } = getApiResponseAlertContext(
          error.statusMessage
        )
        useAlerts.alert(message, type as AlertType)
        console.error(error)
      })
  }
</script>

<template>
  <VForm ref="form" @submit.prevent="submit">
    <VContainer>
      <VRow>
        <FormEmailInput
          v-model="state.email"
          :content="{
            label: $t('user.login.email'),
          }"
          :rules="[useRequiredInput]"
        />
      </VRow>
      <VRow>
        <FormPasswordInput v-model="state.password" />
      </VRow>
    </VContainer>
    <VContainer>
      <VRow>
        <VBtn
          color="success"
          type="submit"
          class="btn--submit"
          :loading="isRegistering"
        >
          {{ $t('user.sign_in') }}
        </VBtn>
      </VRow>
    </VContainer>
    <VContainer class="my-0 pt-2">
      <VRow class="mt-0">
        <!-- TODO: Add @click hook to use Firebase 'Forgot Password' feature -->
        <span class="btn--forgot" @click="resetPassword">{{
          $t('user.login.forgot')
        }}</span>
      </VRow>
      <VRow class="mt-0">
        <VBtn
          color="primary"
          variant="outlined"
          class="btn--register"
          :disabled="isRegistering"
          @click="navigateTo(localePath('/user/signup'))"
        >
          {{ $t('user.sign_up') }}
        </VBtn>
      </VRow>
    </VContainer>
  </VForm>
</template>

<style scoped lang="scss">
  @import 'vuetify/settings';

  .v-container {
    max-width: 26rem !important;
    margin-block: 0.5rem;
  }

  .v-row {
    padding-block: 0.5rem;
  }

  .v-tab--selected {
    background: rgba(var(--v-theme-accent), 0.08);
  }

  .v-window__container {
    div {
      padding-block: 0.6rem;
    }
  }

  .btn {
    &--submit,
    &--register {
      width: 60%;
      margin-inline: 20% !important;
    }

    &--forgot {
      margin: 0.4rem auto !important;
      font-weight: 600;
      font-style: italic;
      font-size: 1.1rem;

      &:hover {
        text-decoration: underline;
        cursor: pointer;
      }
    }
  }

  @media #{map-get($display-breakpoints, 'sm-and-down')} {
    .v-tab {
      font-size: 1rem;
    }

    .btn {
      &--submit,
      &--register {
        width: 100%;
        margin: 0 !important;
      }
    }
  }
</style>
