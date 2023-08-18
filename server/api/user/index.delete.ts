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
  let { uid } = await readBody(event)

  // only admins can remove other users
  if (!hasAccessLevel(user, 'admin') || !uid) {
    uid = user.uid
  }

  // reference to users
  const usersRef = db.ref('users')

  // remove user
  usersRef.child(uid).remove()

  // user successfully removed
  sendNoContent(event, 204)
})
