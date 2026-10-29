/**
 * Works out who sent a request: a bearer token from an API client, or the browser's session
 *
 * Both are verified with Firebase and checked for revocation (#582). An invalid session cookie is
 * removed, so the browser stops sending it.
 */
import { deleteCookie, getCookie, getHeader } from 'h3'
import {
  bearerOf,
  callerOf,
  OLD_TOKEN_COOKIE,
  SESSION_COOKIE,
} from '@/server/auth/session'

export default defineEventHandler(async (event) => {
  const { wideEvent } = event.context
  const bearer = bearerOf(getHeader(event, 'Authorization'))
  const session = getCookie(event, SESSION_COOKIE) ?? null
  const oldToken = getCookie(event, OLD_TOKEN_COOKIE)

  const caller =
    bearer || session ? await callerOf(auth, { bearer, session }) : null
  if (caller) event.context.decodedToken = caller.token
  // a session the server no longer accepts, and the old one-hour token cookie, go away
  if (session && !bearer && !caller) {
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
  }
  if (oldToken) deleteCookie(event, OLD_TOKEN_COOKIE, { path: '/' })

  if (wideEvent) {
    wideEvent.auth = caller
      ? { authenticated: true, token_valid: true, auth_method: caller.method }
      : bearer || session
        ? {
            authenticated: false,
            token_valid: false,
            auth_method: bearer ? 'bearer' : 'session',
          }
        : { authenticated: false }
  }
})
