export default defineEventHandler(async (event) => {
  const { decodedToken } = event.context

  // user is not authenticated
  if (!decodedToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })
  }

  // reference to users
  const usersRef = db.ref('users')

  // get user data
  const snapshot = await usersRef
    .orderByKey()
    .equalTo(decodedToken.sub)
    .once('value')

  // get user object
  const data = snapshot.val()
  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found in database',
    })

  // return user data
  return data
})
