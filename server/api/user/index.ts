// GET /api/user
// endpoint for fetching a users data from database

export default defineEventHandler(async (event) => {
  const { decodedToken, user } = event.context

  // user is not authenticated
  if (!decodedToken)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  if (!user)
    throw createError({
      statusCode: 404,
      statusMessage: 'User data not found',
    })

  // return user data
  return user
})
