// get internationalization string from locales/*.json
export const getI18nString = (key: string) => {
  const nuxtApp = useNuxtApp()
  const message = nuxtApp.$i18n.t(key)

  // message is not found
  if (key === message) return undefined

  return message
}
