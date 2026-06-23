// DELETE /api/user
// endpoint for removing a user in the database

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'user', user?.uid, 'delete', 'Delete user(s)')
  setLogImportance(event, 'warn')

  // user is not authenticated
  if (!user) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  // get request body
  let { UIDs } = await readBody(event)

  // only admins can remove other users than their own
  if (!hasAccess(user, ['admin']) || !UIDs) {
    UIDs = user.uid
  }

  // UIDs can be passed both as an array or a single UID string
  if (typeof UIDs !== 'object') UIDs = [UIDs]

  addEventContext(event, 'target_uid_count', (UIDs as string[]).length)

  // reference to users
  const usersRef = db.ref('users')

  // remove users from db
  usersRef.update(
    // format UIDs array as object with the UIDs as keys and values null
    Object.assign({}, ...(UIDs as string[]).map((uid) => ({ [uid]: null }))),
  )
  trackDbDelete(event, 'users')

  // remove firebase auth users
  await withDbTiming(event, 'auth/users', 'delete', () =>
    auth.deleteUsers(UIDs),
  )

  // users successfully removed
  sendNoContent(event, 204)
})
