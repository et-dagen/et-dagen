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
  let { sub, accessLevel, studyProgram } = await readBody(event)

  if (!studyProgram)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing study program',
    })

  // only admins can modify user access levels
  if (!hasAccessLevel(user, 'admin') || !sub || !accessLevel) {
    sub = decodedToken.sub
    accessLevel = []
  }

  // reference to users
  const usersRef = db.ref('users')

  // add or update user in database
  usersRef.child(sub).set({
    accessLevel,
    studyProgram,
  })

  // user successfully modified
  sendNoContent(event, 201)
})
