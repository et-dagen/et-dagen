// PUT /api/user
// endpoint for updating the name of a user in the database

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { userUID, newName } = await readBody(event)
  // user is not authenticated
  if (!user)
    throw createError({
      statusCode: 401,
      statusMessage: 'Not signed in',
    })
  // check if the user is admin
  const isAdmin = hasAccess(user, ['admin'])
  // if the user is admin, or trying to change own name
  if (isAdmin || userUID === user.value.uid) {
    // update name with ID
    auth.updateUser(userUID, newName)
  }

  // send response to remove cookie
  sendNoContent(event, 204)
})
