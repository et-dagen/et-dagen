const errorMessageMap = new Map([
  [
    'Firebase: Error (auth/email-already-in-use).',
    {
      source: 'firebase',
      type: 'error',
      message: 'email_in_use',
    },
  ],
])

export type AlertType = 'error' | 'info' | 'success' | 'warning' | undefined
export const getAlertTypeFromErrorMessage = (errorMessage: string) => {
  return errorMessageMap.get(errorMessage)?.type as AlertType
}

export const mapErrorMessageToAlertInfo = (errorMessage: string) => {
  return errorMessageMap.get(errorMessage) || 'unknown_error'
}

export const getI18nAlertRoute = (errorMessage: string) => {
  const alert = mapErrorMessageToAlertInfo(errorMessage)
  if (alert === 'unknown_error')
    return { type: 'warning', route: 'alert.unknown_error' }

  const { source, type, message } = alert
  return `alert.${type}.${source}.${message}`
}

export const getAlertRouteAndType = (errorMessage: string) => {
  return {
    type: getAlertTypeFromErrorMessage(errorMessage),
    route: getI18nAlertRoute(errorMessage),
  }
}
