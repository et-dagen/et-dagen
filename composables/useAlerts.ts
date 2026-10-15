// get server response message
// input format: 'ErrorType (subCatergory/subsubCatergory/error-message)'
// categories followed by / are optional
export const getApiResponseAlertContext = (response: string) => {
  const nuxtApp = useNuxtApp()

  if (!response)
    return { type: 'error', message: nuxtApp.$i18n.t('alert.default_message') }

  // split response to get type and message
  const [responseType, message] = response.toLowerCase().split(' ') as [
    AlertType,
    string,
  ]

  // if unknown response type or incorrect format, return input
  if (!alertTypes.includes(responseType as AlertType))
    return { type: undefined, message: response }

  // format message
  let formattedMessage: string = message
  formattedMessage = formattedMessage
    .slice(0, -1) // remove period
    .replaceAll('/', '.')
    .replace('(', '')
    .replace(')', '')

  // get error message from i18n
  const errorMessage = nuxtApp.$i18n.t(
    `alert.api.${responseType}.${formattedMessage}`,
  )

  // message includes alert. if not found
  if (errorMessage.includes('alert.') || !responseType || !formattedMessage)
    return { type: 'error', message: nuxtApp.$i18n.t('alert.default_message') }

  return {
    type: responseType,
    message: errorMessage,
  }
}

// Firebase Auth errors carry a `code`, not the server's `statusMessage`
const firebaseAuthAlertKeys: Record<string, string> = {
  'auth/email-already-in-use': 'alert.error.firebase.email_in_use',
  'auth/invalid-email': 'alert.error.firebase.invalid_email',
  'auth/user-not-found': 'alert.error.firebase.user_not_found',
  'auth/wrong-password': 'alert.error.firebase.wrong_password',
  'auth/invalid-credential': 'alert.error.firebase.wrong_password',
}

export const firebaseAuthAlertKey = (error: unknown): string | undefined => {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' ? firebaseAuthAlertKeys[code] : undefined
}

// alert for any error thrown by a form submit, from Firebase Auth or the API
export const getErrorAlertContext = (error: unknown) => {
  const key = firebaseAuthAlertKey(error)
  if (key) return { type: 'error', message: useNuxtApp().$i18n.t(key) }

  return getApiResponseAlertContext(
    (error as { statusMessage?: string } | null)?.statusMessage ?? '',
  )
}
