import { deleteCookie, setCookie, type H3Event } from 'h3'
import {
  OLD_TOKEN_COOKIE,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from '@/server/auth/session'

/** Set the session cookie: never readable by scripts, never sent from another site */
export const setSessionCookie = (event: H3Event, cookie: string) =>
  setCookie(event, SESSION_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  })

/** Remove the session cookie, and the token cookie it replaced */
export function clearSessionCookies(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  deleteCookie(event, OLD_TOKEN_COOKIE, { path: '/' })
}
