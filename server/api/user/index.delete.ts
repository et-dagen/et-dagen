// DELETE /api/user
// endpoint for removing a user in the database

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // user is not authenticated
  if (!user)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // get request body
  let { UIDs } = await readBody(event)

  // only admins can remove other users than their own
  if (!hasAccess(user, ['admin']) || !UIDs) {
    UIDs = user.uid
  }

  if (typeof UIDs !== 'object') UIDs = [UIDs]

  // reference to users
  const usersRef = db.ref('users')

  // // remove user
  usersRef.update(
    Object.assign({}, ...(UIDs as string[]).map((uid) => ({ [uid]: null })))
  )

  // // remove firebase auth user
  await auth.deleteUsers(UIDs)

  // user successfully removed
  sendNoContent(event, 204)
})
