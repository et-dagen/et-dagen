import { describe, expect, it, vi } from 'vitest'
import {
  bearerOf,
  callerOf,
  FRESH_SIGN_IN_SECONDS,
  SESSION_SECONDS,
  startSession,
} from '@/server/auth/session'

const NOW = 1_800_000_000
const token = (authTime: number) => ({ uid: 'ada', auth_time: authTime })

/** Firebase Auth with only what sessions use; `revoked` makes every check fail */
const fakeAuth = (authTime = NOW - 10, revoked = false) => ({
  verifyIdToken: vi.fn((value: string) =>
    revoked || value === 'bad'
      ? Promise.reject(new Error('auth/id-token-revoked'))
      : Promise.resolve(token(authTime)),
  ),
  createSessionCookie: vi.fn(() => Promise.resolve('session-cookie')),
  verifySessionCookie: vi.fn((value: string) =>
    revoked || value !== 'session-cookie'
      ? Promise.reject(new Error('auth/session-cookie-revoked'))
      : Promise.resolve(token(authTime)),
  ),
  revokeRefreshTokens: vi.fn(() => Promise.resolve()),
})

describe('startSession', () => {
  it('makes a two-week session cookie from a fresh sign-in, checking revocation', async () => {
    const auth = fakeAuth()

    await expect(startSession(auth as never, 'id', NOW)).resolves.toEqual({
      cookie: 'session-cookie',
      uid: 'ada',
    })
    expect(auth.verifyIdToken).toHaveBeenCalledWith('id', true)
    expect(auth.createSessionCookie).toHaveBeenCalledWith('id', {
      expiresIn: SESSION_SECONDS * 1000,
    })
  })

  it('refuses a sign-in older than five minutes, and an invalid token', async () => {
    const stale = fakeAuth(NOW - FRESH_SIGN_IN_SECONDS - 1)
    await expect(startSession(stale as never, 'id', NOW)).rejects.toMatchObject(
      {
        code: 'session/stale-sign-in',
      },
    )
    expect(stale.createSessionCookie).not.toHaveBeenCalled()

    await expect(
      startSession(fakeAuth() as never, 'bad', NOW),
    ).rejects.toMatchObject({ code: 'session/invalid-token' })
  })
})

describe('callerOf', () => {
  it('prefers the bearer token, then the session, both checked for revocation', async () => {
    const auth = fakeAuth()

    await expect(
      callerOf(auth as never, { bearer: 'id', session: 'session-cookie' }),
    ).resolves.toMatchObject({ method: 'bearer' })
    await expect(
      callerOf(auth as never, { bearer: null, session: 'session-cookie' }),
    ).resolves.toMatchObject({ method: 'session', token: { uid: 'ada' } })
    expect(auth.verifySessionCookie).toHaveBeenCalledWith(
      'session-cookie',
      true,
    )
  })

  it('is null for a revoked session or token, or nothing at all', async () => {
    const revoked = fakeAuth(NOW, true)
    await expect(
      callerOf(revoked as never, { bearer: null, session: 'session-cookie' }),
    ).resolves.toBeNull()
    await expect(
      callerOf(revoked as never, { bearer: 'id', session: null }),
    ).resolves.toBeNull()
    await expect(
      callerOf(fakeAuth() as never, { bearer: null, session: null }),
    ).resolves.toBeNull()
  })
})

describe('bearerOf', () => {
  it('reads only a Bearer header', () => {
    expect(bearerOf('Bearer abc')).toBe('abc')
    expect(bearerOf('Basic abc')).toBeNull()
    expect(bearerOf(undefined)).toBeNull()
  })
})
