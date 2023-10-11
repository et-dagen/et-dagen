export const useRequiredInput = (value: string) => {
  const nuxtApp = useNuxtApp()
  return !!value || nuxtApp.$i18n.t('error.form.general.required')
}

export const useValidateEmail = (value: string) => {
  const nuxtApp = useNuxtApp()
  const emailRegex = /\S+@\S+\.\S+/
  return emailRegex.test(value) || nuxtApp.$i18n.t('error.form.general.email')
}

export const useValidatePassword = (value: string) => {
  const nuxtApp = useNuxtApp()
  if (value.length < 8) return nuxtApp.$i18n.t('error.form.password.length')

  // Fail validation if value doesn not contain minimum 3 letters
  if (!value.match(/^(.*[a-zA-Z]){3}/))
    return nuxtApp.$i18n.t('error.form.password.letters')

  // Fail validation if value does not contain minimum 3 numbers
  if (!value.match(/^(.*[0-9]){3}/))
    return nuxtApp.$i18n.t('error.form.password.numbers')

  // Fail validation if value does not contain minimum 1 special characters
  if (!value.match(/^(.*[!@#$%^&*()\-_=+{};:,<.>]){1}/))
    return nuxtApp.$i18n.t('error.form.password.special')

  // Fail validation if value doen not contain minimum 1 uppercase letter
  if (!value.match(/^(.*[A-Z]){1}/))
    return nuxtApp.$i18n.t('error.form.password.uppercase')

  return true
}

export const useRequireEqualPasswords = (value: any, other: any) => {
  const nuxtApp = useNuxtApp()
  return value === other || nuxtApp.$i18n.t('error.form.general.equal_password')
}
