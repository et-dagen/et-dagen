// POST /api/v1/user/signout
// endpoint for removing the token cookie after the user signs out

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Sign out user',
    description:
      'Clears the _token cookie. The Firebase ID token itself remains valid until it expires.',
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

export default defineEventHandler((event) => {
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

  deleteCookie(event, '_token')

  // send response to remove cookie
  sendNoContent(event, 204)
})
