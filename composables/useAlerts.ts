import { errorFeedback, UNKNOWN } from '~/composables/errors/feedback'

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

/**
 * The message for any error a user action can end in: Firebase Auth, the API, or the network
 *
 * Unexpected errors carry the request id, so a user's report can be matched to the log.
 */
export const getErrorAlertContext = (error: unknown) => {
  const { t, te } = useNuxtApp().$i18n
  const { key, requestId } = errorFeedback(error, (k) => te(k))
  const message =
    key === UNKNOWN && requestId
      ? `${t(key)} ${t('errors.reference', { requestId })}`
      : t(key)
  return { type: 'error' as const, message }
}

/** Show the alert for an error, as every failed form submit should */
export const alertError = (error: unknown) => {
  const { type, message } = getErrorAlertContext(error)
  useAlertStore().alert(message, type)
}
