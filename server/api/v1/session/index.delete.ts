// DELETE /api/v1/session
// endpoint for signing out
import { defineEventHandler, sendNoContent } from 'h3'
import { defineRouteMeta } from 'nitropack/runtime'
import { clearSessionCookies } from '@/server/auth/cookies'
import { endSessions } from '@/server/auth/session'
import { auth } from '@/server/utils/firebase'
import { setResourceContext } from '@/server/utils/wideEventHelpers'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'End the session',
    description:
      'Clears the session cookie and, for a signed-in caller, revokes their sessions on every ' +
      'device, so neither the cookie nor an ID token from before works again. Answers 204 ' +
      'whether or not anyone was signed in.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { decodedToken } = event.context
  setResourceContext(
    event,
    'session',
    decodedToken?.uid,
    'delete',
    'End the session',
  )
  if (decodedToken?.uid) await endSessions(auth, decodedToken.uid)
  clearSessionCookies(event)
  sendNoContent(event, 204)
})
