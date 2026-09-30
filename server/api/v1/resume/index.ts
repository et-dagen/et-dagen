// GET /api/v1/resume
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

defineRouteMeta({
  openAPI: {
    tags: ['Resume'],
    summary: 'List user resumes',
    description:
      'Returns the calling user by default. scope=all lists every user holding a resume and ' +
      'requires admin or a company account with CV access.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'scope',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Set to all to list every resume holder',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'User, or map of UID to User when scope=all' },
    //   401: { description: 'User not authenticated' },
    //   404: { description: 'User data not found' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { decodedToken, user } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'resume', undefined, 'list', 'List user resumes')

  // user is not authenticated
  if (!decodedToken) {
    setErrorContext(event, {
      code: 'auth/not-authenticated',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })
  }

  if (!user) {
    setErrorContext(event, {
      code: 'user/not-found',
      message: 'User data not found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'User data not found',
    })
  }

  // get scope from query params
  const { scope } = getQuery(event)

  // only admins can get other users than their own
  // TODO! Restrict company user access by adding custom endpoint for /api/v1/company/events/users
  if (!hasAccess(user, ['admin', 'company']) || !scope || scope !== 'all')
    return user

  // reference to users
  const usersRef = db.ref('users')

  // get all users from db
  const snapshot = await withDbTiming(event, 'users', 'read', () =>
    usersRef.once('value'),
  )
  const dbUsers = snapshot.val()

  // get the first 1000 users from firebase auth
  const firebaseUsers = await auth.listUsers()

  // combine users from db and firebase auth, only include users with cvAccess field
  const users = firebaseUsers.users
    .map((firebaseUser) => ({
      ...formatFirebaseUser(firebaseUser),
      ...dbUsers[firebaseUser.uid],
    }))
    .filter((user) => user.resume && isValidFirebaseStorageLink(user.resume))

  // Add result metadata to wide event
  addEventContext(event, 'result_count', users.length)

  return users
})
