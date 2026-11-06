/**
 * What to tell a user about a failed request: a translation key, and the request id to quote
 *
 * Kept free of Nuxt so every branch can be tested. `has` is the i18n `te` check, so a code with
 * no translation yet falls back instead of showing a raw key.
 */
export interface ErrorFeedback {
  key: string
  /** Shown with unexpected errors, so a report can be matched to the server's log line */
  requestId?: string
}

export const UNKNOWN = 'errors.unknown'
export const OFFLINE = 'errors.network.offline'

/** Firebase Auth codes users can cause, by the key that explains them */
export const FIREBASE_AUTH_KEYS: Readonly<Record<string, string>> = {
  'auth/invalid-credential': 'errors.auth.invalid-credential',
  'auth/wrong-password': 'errors.auth.invalid-credential',
  'auth/user-not-found': 'errors.auth.invalid-credential',
  'auth/invalid-email': 'errors.auth.invalid-email',
  'auth/missing-password': 'errors.auth.missing-password',
  'auth/email-already-in-use': 'errors.auth.email-already-in-use',
  'auth/weak-password': 'errors.auth.weak-password',
  'auth/too-many-requests': 'errors.auth.too-many-requests',
  'auth/user-disabled': 'errors.auth.user-disabled',
  'auth/network-request-failed': OFFLINE,
}

/** Status codes that say enough on their own when an error has no known code */
export const STATUS_KEYS: Readonly<Record<number, string>> = {
  401: 'errors.http.unauthenticated',
  403: 'errors.http.forbidden',
  404: 'errors.http.not-found',
  429: 'errors.http.too-many-requests',
}

/** v1 handlers write the code into the status message as `Error (<code>).` */
const LEGACY_CODE = /^(?:\w+: )?Error \(([^)]+)\)\.?$/

interface FailedRequest {
  code?: unknown
  statusCode?: number
  statusMessage?: string
  data?: { code?: unknown; statusMessage?: string; request_id?: unknown }
  response?: { headers?: { get?: (name: string) => string | null } }
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

/** The API's error code: from the error boundary's body, or a v1 status message */
function apiCode(error: FailedRequest): string | undefined {
  const code = asString(error.data?.code)
  if (code && !code.startsWith('http/')) return code
  const message = error.data?.statusMessage ?? error.statusMessage ?? ''
  return LEGACY_CODE.exec(message)?.[1]
}

export function errorFeedback(
  error: unknown,
  has: (key: string) => boolean,
): ErrorFeedback {
  const failed = (error ?? {}) as FailedRequest

  const firebase = asString(failed.code)
  if (firebase?.startsWith('auth/')) {
    return { key: FIREBASE_AUTH_KEYS[firebase] ?? UNKNOWN }
  }

  const requestId =
    asString(failed.data?.request_id) ??
    asString(failed.response?.headers?.get?.('x-request-id'))

  // a fetch that never got an answer has no response and no status
  if ('response' in failed && !failed.response && !failed.statusCode) {
    return { key: OFFLINE }
  }

  const code = apiCode(failed)
  if (code) {
    const path = code.toLowerCase().replaceAll('/', '.')
    for (const key of [`errors.${path}`, `alert.api.error.${path}`]) {
      if (has(key)) return { key, requestId }
    }
  }

  const byStatus = failed.statusCode && STATUS_KEYS[failed.statusCode]
  if (byStatus) return { key: byStatus, requestId }

  return { key: UNKNOWN, requestId }
}
