// GET /api/user
// endpoint for fetching user data with resumes from database

const isValidFirebaseStorageLink = async (link: string): Promise<boolean> => {
  // check if link is a string
  if (typeof link !== 'string') return false

  // check if link is a firebase storage link
  const isFirebaseLink =
    link.startsWith('https://firebasestorage.googleapis.com/v0/b/') &&
    link.includes('o/') &&
    link.includes('resumes%2F') &&
    link.includes('?alt=media')

  if (!isFirebaseLink) return false

  // verify if the link is actually saved in the storage database
  try {
    const response = await fetch(link, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

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

  // get scope from query params
  const { scope } = getQuery(event)

  // only admins can get other users than their own
  // TODO! Restrict company user access by adding custom endpoint for /api/company/events/users
  if (!hasAccess(user, ['admin', 'company']) || !scope || scope !== 'all')
    return user

  // reference to users
  const usersRef = db.ref('users')

  // get all users from db
  const snapshot = await usersRef.once('value')
  const dbUsers = snapshot.val()

  // get the first 1000 users from firebase auth
  const firebaseUsers = await auth.listUsers()

  // combine users from db and firebase auth, only include users with cv_access field
  const users = firebaseUsers.users
    .map((firebaseUser) => ({
      ...formatFirebaseUser(firebaseUser),
      ...dbUsers[firebaseUser.uid],
    }))
    .filter((user) => user.resume && isValidFirebaseStorageLink(user.resume))

  return users
})
