// POST /api/user
// endpoint for creating or updating a user in the database

export default defineEventHandler(async (event) => {
  const { decodedToken, user } = event.context

  // user is not authenticated
  if (!decodedToken)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // get request body
  let { uid, accessLevel, studyProgram } = await readBody(event)

  if (!studyProgram)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing study program',
    })

  // only admins can modify user access levels
  if (!hasAccessLevel(user, 'admin') || !uid || !accessLevel) {
    uid = decodedToken.uid
    accessLevel = []
  }

  // reference to users
  const usersRef = db.ref('users')

  // add or update user in database
  usersRef.child(uid).set({
    accessLevel,
    studyProgram,
    updated: Date.now(),
  })

  // user successfully modified
  sendNoContent(event, 201)
})
