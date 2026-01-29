// GET /api/user
// endpoint for fetching user data from database

export default defineEventHandler(async (event) => {
  const { decodedToken, user } = event.context

  // get scope from query params
  const { scope } = getQuery(event)
  const isListRequest = scope === 'all'

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'user',
    isListRequest ? undefined : user?.uid,
    isListRequest ? 'list' : 'get',
    isListRequest ? 'List all users' : 'Fetch current user',
  )

  // user is not authenticated
  if (!decodedToken) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  if (!user) {
    setErrorContext(event, {
      code: 'user/not-found',
      message: 'User not found in database',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (user/not-found).',
    })
  }

  // only admins can get other users than their own
  // TODO! Restrict company user access by adding custom endpoint for /api/company/events/users
  if (
    !hasAccess(user, ['admin', 'basic', 'company']) ||
    !scope ||
    scope !== 'all'
  ) {
    // basic users need to be able to get attendant list! Is this a security risk?
    addEventContext(event, 'returned_self', true)
    return user
  }

  // reference to users
  const usersRef = db.ref('users')

  // get all users from db
  const snapshot = await withDbTiming(event, 'users', 'read', () =>
    usersRef.once('value'),
  )
  const dbUsers = snapshot.val()

  // get the first 1000 users from firebase auth
  const firebaseUsers = await auth.listUsers()

  // combine users from db and firebase auth
  const users = firebaseUsers.users.map((firebaseUser) => ({
    ...formatFirebaseUser(firebaseUser),
    ...dbUsers[firebaseUser.uid],
  }))

  addEventContext(event, 'result_count', users.length)

  return users
})
