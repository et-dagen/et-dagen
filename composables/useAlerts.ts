import { toast } from 'vue-sonner'
import { errorFeedback, UNKNOWN } from '@/lib/errors/feedback'

export type NoticeType = 'success' | 'info' | 'warning' | 'error'

/** Short feedback after an action, as a toast; notices only exist in the browser */
export const notify = (message: string, type?: NoticeType) => {
  if (import.meta.server) return
  if (type) toast[type](message)
  else toast(message)
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
  notify(message, type)
}
