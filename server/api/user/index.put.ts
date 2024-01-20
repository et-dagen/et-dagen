// PUT /api/user
// endpoint for updating the name of a user in the database

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { uid, ...newData } = await readBody(event)
  // user is not authenticated
  if (!user)
    throw createError({
      statusCode: 401,
      statusMessage: 'Not signed in',
    })
  // check if the user is admin
  const isAdmin = hasAccess(user, ['admin'])

  if (!isAdmin && uid !== user.uid)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })
  const displayName = newData.name
  // update name with ID
  auth.updateUser(uid, { displayName })

  // send response to remove cookie
  sendNoContent(event, 204)
})
