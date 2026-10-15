import { describe, expect, it } from 'vitest'
import { firebaseAuthAlertKey } from '~/composables/useAlerts'

describe('firebaseAuthAlertKey', () => {
  it('maps the Firebase Auth errors users can cause to their alert text', () => {
    expect(firebaseAuthAlertKey({ code: 'auth/email-already-in-use' })).toBe(
      'alert.error.firebase.email_in_use',
    )
    expect(firebaseAuthAlertKey({ code: 'auth/invalid-email' })).toBe(
      'alert.error.firebase.invalid_email',
    )
    expect(firebaseAuthAlertKey({ code: 'auth/user-not-found' })).toBe(
      'alert.error.firebase.user_not_found',
    )
    expect(firebaseAuthAlertKey({ code: 'auth/wrong-password' })).toBe(
      'alert.error.firebase.wrong_password',
    )
    expect(firebaseAuthAlertKey({ code: 'auth/invalid-credential' })).toBe(
      'alert.error.firebase.wrong_password',
    )
  })

  it('leaves other errors to the API response mapping', () => {
    expect(
      firebaseAuthAlertKey({ code: 'auth/internal-error' }),
    ).toBeUndefined()
    expect(
      firebaseAuthAlertKey({ statusMessage: 'Error (user/invalid-code).' }),
    ).toBeUndefined()
    expect(firebaseAuthAlertKey(null)).toBeUndefined()
    expect(firebaseAuthAlertKey('boom')).toBeUndefined()
  })
})
