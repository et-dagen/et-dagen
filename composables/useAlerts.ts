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
