// GET /api/user
// endpoint for fetching a users data from database

export default defineEventHandler(async (event) => {
  const { user } = event.context
  
  // user is not authenticated
  if (!user)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // return user data
  return user
})
