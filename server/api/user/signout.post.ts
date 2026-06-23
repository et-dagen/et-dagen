// POST /api/user/signout
// endpoint for removing the token cookie after the user signs out

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
