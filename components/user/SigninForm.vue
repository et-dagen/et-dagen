<script setup lang="ts">
  import EmailInput from '@/components/form/EmailInput.vue'
  import PasswordInput from '@/components/user/PasswordInput.vue'
  import { alertError, notify } from '@/composables/useAlerts'
  import { requestPasswordReset, signinUser } from '@/composables/auth/session'
  import { EmailAddress } from '@/domain/email'
  import { errorFeedback } from '@/lib/errors/feedback'

  const localePath = useLocalePath()
  const { t } = useI18n()

  const state = reactive({
    email: '',
    password: '',
  })

  const emailRules = [
    (value: string) =>
      EmailAddress.is(value.trim()) || t('signin.invalid_email'),
  ]
  const passwordRules = [
    (value: string) => !!value || t('errors.auth.missing-password'),
  ]

  const isRegistering = ref<boolean>(false)

  const form = ref()
  const submit = async () => {
    const { valid } = await form.value.validate()
    if (!valid) return

    isRegistering.value = true
    signinUser(state.email.trim(), state.password)
      .catch(alertError)
      .finally(() => {
        isRegistering.value = false
      })
  }

  // only failures that say nothing about the account are shown; the rest get the same answer
  const SHOWN_RESET_ERRORS = [
    'errors.network.offline',
    'errors.auth.too-many-requests',
  ]

  const resetPassword = async () => {
    const email = state.email.trim()
    if (!email) {
      notify(t('alert.error.form.missing_email'), 'error')
      return
    }

    try {
      await requestPasswordReset(email)
    } catch (cause) {
      const { key } = errorFeedback(cause, () => true)
      if (SHOWN_RESET_ERRORS.includes(key)) return alertError(cause)
    }
    notify(t('signin.reset_sent', { email }), 'success')
  }
</script>

<template>
  <VForm ref="form" @submit.prevent="submit">
    <VContainer>
      <VRow>
        <EmailInput
          v-model="state.email"
          autocomplete="username"
          :rules="emailRules"
        />
      </VRow>
      <VRow>
        <PasswordInput
          v-model="state.password"
          autocomplete="current-password"
          :rules="passwordRules"
        />
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
  @use 'sass:map';
  @use 'vuetify/settings';

  .v-container {
    max-width: 26rem;
    margin-block: 0.5rem;
  }

  .v-row {
    padding-block: 0.5rem;
  }

  .btn {
    &--submit,
    &--register {
      width: 60%;
      margin-inline: 20%;
    }

    &--forgot {
      margin: 0.4rem auto;
      font-weight: 600;
      font-style: italic;
      font-size: 1.1rem;

      &:hover {
        text-decoration: underline;
        cursor: pointer;
      }
    }
  }

  @media #{map.get(settings.$display-breakpoints, 'sm-and-down')} {
    .btn {
      &--submit,
      &--register {
        width: 100%;
        margin: 0;
      }
    }
  }
</style>
