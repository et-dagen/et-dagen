// PUT /api/v1/user
// endpoint for updating the name of a user in the database

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { uid, ...newData } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(event, 'user', uid, 'update', 'Update user profile')
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
  // check if the user is admin
  const isAdmin = hasAccess(user, ['admin'])
  addEventContext(event, 'is_admin_action', isAdmin && uid !== user.uid)

  if (!isAdmin && uid !== user.uid) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to update another user',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }
  const displayName = newData.name
  const newEmail = newData.email
  // update name with ID
  auth.updateUser(uid, { displayName, email: newEmail })
  trackDbWrite(event, `auth/users/${uid}`)

  // send response to remove cookie
  sendNoContent(event, 204)
})
