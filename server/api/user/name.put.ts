//

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
  // const firebaseUser = auth.getUser(user.uid)
  if (isAdmin) {
    auth.updateUser(userUID, newName)
  }

  // send response to remove cookie
  sendNoContent(event, 204)
})
