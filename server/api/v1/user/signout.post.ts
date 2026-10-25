// POST /api/v1/user/signout
// endpoint for signing out; kept for older clients, DELETE /api/v1/session does the same
import { clearSessionCookies } from '@/server/auth/cookies'
import { endSessions } from '@/server/auth/session'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Sign out user',
    description:
      'Deprecated: use DELETE /api/v1/session. Clears the session cookie and revokes the ' +
      "caller's sessions on every device.",
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   204: { description: 'Signed out, cookie cleared' },
    //   401: { description: 'Error (firebase/not-signed-in).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'user', user?.uid, 'signout', 'Sign out user')
  setLogImportance(event, 'warn')

  // user is not authenticated
  if (!user) {
    setErrorContext(event, {
      code: 'firebase/not-signed-in',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/not-signed-in).',
    })
  }

  await endSessions(auth, user.uid)
  clearSessionCookies(event)

  // send response to remove cookie
  sendNoContent(event, 204)
})
