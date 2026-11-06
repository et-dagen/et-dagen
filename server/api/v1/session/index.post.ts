// POST /api/v1/session
// endpoint for starting a browser session after signing in
import { defineEventHandler, readBody, sendNoContent } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { fail } from '@/domain/errors'
import { setSessionCookie } from '@/server/auth/cookies'
import { startSession } from '@/server/auth/session'
import { auth } from '@/server/utils/firebase'
import {
  addEventContext,
  setResourceContext,
} from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Start a session',
    description:
      'Body: `{ idToken }`, the Firebase ID token from a sign-in in the last five minutes. Sets ' +
      'the `__session` cookie (HttpOnly, SameSite=Strict, two weeks), which the server checks ' +
      'on every request, including whether it was revoked. API clients can send ' +
      '`Authorization: Bearer <ID token>` instead.',
    security: [],
  },
})

export default defineEventHandler(async (event) => {
  setResourceContext(event, 'session', undefined, 'create', 'Start a session')
  const { idToken } = ((await readBody(event)) ?? {}) as { idToken?: unknown }
  if (typeof idToken !== 'string' || idToken === '') {
    throw fail('session/missing-token')
  }

  const { cookie, uid } = await startSession(
    auth,
    idToken,
    Math.floor(Date.now() / 1000),
  )
  addEventContext(event, 'session_user', uid)
  setSessionCookie(event, cookie)
  sendNoContent(event, 204)
})
