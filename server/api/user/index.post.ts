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
  // eslint-disable-next-line prefer-const
  let { uid, userType, studyProgram } = await readBody(event)

  if (!studyProgram)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing study program',
    })

  // only admins can modify usertypes and other users than their own
  if (!hasAccess(user, ['admin']) || !uid || !userType) {
    uid = decodedToken.uid
    userType = null
  }

  // reference to users
  const usersRef = db.ref('users')

  // add or update user in database
  usersRef.child(uid).set({
    userType,
    studyProgram,
    updated: Date.now(),
  })

  // user successfully modified
  sendNoContent(event, 201)
})
