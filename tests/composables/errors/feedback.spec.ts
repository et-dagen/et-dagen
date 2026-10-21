import { describe, expect, it } from 'vitest'
import enGB from '@/i18n/locales/en-GB.json'
import nbNO from '@/i18n/locales/nb-NO.json'
import {
  errorFeedback,
  FIREBASE_AUTH_KEYS,
  OFFLINE,
  STATUS_KEYS,
  UNKNOWN,
} from '~/composables/errors/feedback'

type Messages = Record<string, unknown>

const keysOf = (messages: Messages, prefix = ''): string[] =>
  Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keysOf(value as Messages, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )

const english = new Set(keysOf(enGB))
const has = (key: string) => english.has(key)

describe('errorFeedback', () => {
  it('explains the Firebase Auth errors users cause', () => {
    expect(errorFeedback({ code: 'auth/invalid-credential' }, has)).toEqual({
      key: 'errors.auth.invalid-credential',
    })
    expect(errorFeedback({ code: 'auth/too-many-requests' }, has).key).toBe(
      'errors.auth.too-many-requests',
    )
    expect(
      errorFeedback({ code: 'auth/network-request-failed' }, has).key,
    ).toBe(OFFLINE)
    expect(errorFeedback({ code: 'auth/internal-error' }, has).key).toBe(
      UNKNOWN,
    )
  })

  it('reads the code from the error boundary, with its request id', () => {
    const error = {
      statusCode: 500,
      data: { code: 'internal/unexpected', request_id: 'req_1' },
    }
    expect(errorFeedback(error, has)).toEqual({
      key: 'errors.internal.unexpected',
      requestId: 'req_1',
    })
  })

  it('reads a v1 status message from the body, as HTTP/2 has no status text', () => {
    const error = {
      statusCode: 404,
      statusMessage: '',
      data: { statusMessage: 'Error (event/register/registration-closed).' },
    }
    expect(errorFeedback(error, has).key).toBe(
      'alert.api.error.event.register.registration-closed',
    )
    const prefixed = {
      data: { statusMessage: 'Events: Error (user/invalid-code).' },
    }
    expect(errorFeedback(prefixed, has).key).toBe(
      'alert.api.error.user.invalid-code',
    )
  })

  it('falls back to the status, then to the generic message', () => {
    const untranslated = (statusCode: number) => ({
      statusCode,
      data: { statusMessage: 'Error (area/not-translated).' },
      response: { headers: { get: () => 'req_2' } },
    })
    expect(errorFeedback(untranslated(403), has)).toEqual({
      key: 'errors.http.forbidden',
      requestId: 'req_2',
    })
    expect(errorFeedback(untranslated(500), has)).toEqual({
      key: UNKNOWN,
      requestId: 'req_2',
    })
    expect(errorFeedback(new Error('boom'), has).key).toBe(UNKNOWN)
    expect(errorFeedback(undefined, has).key).toBe(UNKNOWN)
  })

  it('tells a request that got no answer apart from a server error', () => {
    expect(errorFeedback({ response: undefined }, has).key).toBe(OFFLINE)
  })
})

describe('error translations', () => {
  const norwegian = new Set(keysOf(nbNO))
  const errorKeys = (keys: Set<string>) =>
    [...keys].filter((key) => key.startsWith('errors.')).sort()

  it('exist in both languages', () => {
    expect(errorKeys(norwegian)).toEqual(errorKeys(english))
  })

  it('cover every key the mapping can produce', () => {
    const produced = [
      UNKNOWN,
      OFFLINE,
      'errors.reference',
      ...Object.values(FIREBASE_AUTH_KEYS),
      ...Object.values(STATUS_KEYS),
    ]
    for (const key of produced) {
      expect(english.has(key), key).toBe(true)
      expect(norwegian.has(key), key).toBe(true)
    }
  })

  it('keep the request id placeholder in both languages', () => {
    expect(enGB.errors.reference).toContain('{requestId}')
    expect(nbNO.errors.reference).toContain('{requestId}')
  })
})
