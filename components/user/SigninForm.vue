<script setup lang="ts">
  import EmailInput from '@/components/form/EmailInput.vue'
  import FormButton from '@/components/user/FormButton.vue'
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

  // a rule speaks once its field has been typed in, or once the form is sent
  const checked = reactive({ email: false, password: false })
  watch(
    () => state.email,
    () => (checked.email = true),
  )
  watch(
    () => state.password,
    () => (checked.password = true),
  )
  // like the old fields, show the first rule that fails
  const firstError = (
    rules: ((value: string) => true | string)[],
    value: string,
  ): string[] =>
    rules
      .map((rule) => rule(value))
      .filter((result): result is string => result !== true)
      .slice(0, 1)
  const emailErrors = computed(() =>
    checked.email ? firstError(emailRules, state.email) : [],
  )
  const passwordErrors = computed(() =>
    checked.password ? firstError(passwordRules, state.password) : [],
  )

  const isRegistering = ref<boolean>(false)
  const BUTTON =
    'tw:mx-[20%] tw:w-[60%] tw:max-[960px]:mx-0 tw:max-[960px]:w-full'

  const submit = () => {
    checked.email = checked.password = true
    if (emailErrors.value.length || passwordErrors.value.length) return

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
  <form
    class="tw:mx-auto tw:mt-2 tw:max-w-[26rem] tw:px-1 tw:pt-1"
    novalidate
    @submit.prevent="submit"
  >
    <div class="tw:py-2">
      <EmailInput
        v-model="state.email"
        autocomplete="username"
        :error-messages="emailErrors"
      />
    </div>
    <div class="tw:py-2">
      <PasswordInput
        v-model="state.password"
        autocomplete="current-password"
        :error-messages="passwordErrors"
      />
    </div>
    <FormButton
      tone="success"
      type="submit"
      :loading="isRegistering"
      :class="['tw:mt-6', BUTTON]"
    >
      {{ $t('user.sign_in') }}
    </FormButton>
    <button
      type="button"
      class="tw:mx-auto tw:mt-10.5 tw:block tw:text-[1.1rem] tw:leading-[26px] tw:font-semibold tw:italic tw:hover:underline"
      @click="resetPassword"
    >
      {{ $t('user.login.forgot') }}
    </button>
    <FormButton
      tone="brand"
      look="outlined"
      :disabled="isRegistering"
      :class="['tw:mt-2.75', BUTTON]"
      @click="navigateTo(localePath('/user/signup'))"
    >
      {{ $t('user.sign_up') }}
    </FormButton>
  </form>
</template>
