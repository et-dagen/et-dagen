/**
 * Server sessions as Firebase prescribes for server-rendered sites
 *
 * @remarks
 * A browser exchanges the ID token from a fresh sign-in for a session cookie once, and every
 * request after that is checked with `verifySessionCookie(…, true)`, which also refuses a revoked
 * session or a disabled account. API clients keep sending `Authorization: Bearer`, checked the
 * same way. See https://firebase.google.com/docs/auth/admin/manage-cookies (#582).
 */
import type { Auth, DecodedIdToken } from 'firebase-admin/auth'
import { fail } from '@/domain/errors'

/** The cookie that holds the session; `__session` is the one name Firebase Hosting forwards */
export const SESSION_COOKIE = '__session'

/** The cookie that used to hold a raw ID token for 24 hours; it is cleared where it is still sent */
export const OLD_TOKEN_COOKIE = '_token'

/** How long a session lasts; Firebase allows five minutes to two weeks */
export const SESSION_SECONDS = 14 * 24 * 60 * 60

/** How recent the sign-in must be to start a session, so a stolen old token cannot */
export const FRESH_SIGN_IN_SECONDS = 5 * 60

type SessionAuth = Pick<
  Auth,
  | 'verifyIdToken'
  | 'createSessionCookie'
  | 'verifySessionCookie'
  | 'revokeRefreshTokens'
>

/**
 * Turn the ID token of a sign-in that just happened into a session cookie
 *
 * @param now seconds since the epoch
 * @throws AppError `session/invalid-token` or `session/stale-sign-in`
 */
export async function startSession(
  auth: SessionAuth,
  idToken: string,
  now: number,
): Promise<{ cookie: string; uid: string }> {
  let token: DecodedIdToken
  try {
    token = await auth.verifyIdToken(idToken, true)
  } catch (cause) {
    throw fail('session/invalid-token', { cause })
  }
  if (now - token.auth_time > FRESH_SIGN_IN_SECONDS) {
    throw fail('session/stale-sign-in')
  }
  const cookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_SECONDS * 1000,
  })
  return { cookie, uid: token.uid }
}

export type Caller = {
  token: DecodedIdToken
  method: 'bearer' | 'session'
}

/**
 * Who sent a request: the bearer token wins, then the session cookie; null when neither is valid
 *
 * @remarks
 * Both are checked for revocation, so signing out, a password change or a disabled account takes
 * effect on the next request rather than when a token runs out.
 */
export async function callerOf(
  auth: SessionAuth,
  credentials: { bearer: string | null; session: string | null },
): Promise<Caller | null> {
  try {
    if (credentials.bearer) {
      return {
        token: await auth.verifyIdToken(credentials.bearer, true),
        method: 'bearer',
      }
    }
    if (credentials.session) {
      return {
        token: await auth.verifySessionCookie(credentials.session, true),
        method: 'session',
      }
    }
  } catch {
    // expired, revoked, disabled or forged: the request is anonymous
  }
  return null
}

/** End every session of a user: this browser's, and the refresh tokens of all their devices */
export const endSessions = (auth: SessionAuth, uid: string) =>
  auth.revokeRefreshTokens(uid)

/** The bearer token in an `Authorization` header, if any */
export const bearerOf = (header: string | undefined) =>
  header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
