const errorMessageMap = new Map([
  [
    'Firebase: Error (auth/email-already-in-use).',
    {
      source: 'firebase',
      type: 'error',
      message: 'email_in_use',
    },
  ],
  [
    'Invalid registration code',
    {
      source: 'server',
      type: 'error',
      message: 'invalid_registration_code',
    },
  ],
])

export type AlertType = 'error' | 'info' | 'success' | 'warning' | undefined
export const getAlertTypeFromErrorMessage = (errorMessage: string) => {
  return (errorMessageMap.get(errorMessage)?.type || 'error') as AlertType
}

export const mapErrorMessageToAlertInfo = (errorMessage: string) => {
  return errorMessageMap.get(errorMessage) || 'missing_error'
}

export const getI18nAlertRoute = (errorMessage: string) => {
  const alert = mapErrorMessageToAlertInfo(errorMessage)
  if (alert === 'missing_error') return 'alert.error.default'

  const { source, type, message } = alert
  return `alert.${type}.${source}.${message}`
}

export const getAlertRouteAndType = (errorMessage: string) => {
  return {
    type: getAlertTypeFromErrorMessage(errorMessage),
    route: getI18nAlertRoute(errorMessage),
  }
}
