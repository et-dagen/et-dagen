// GET /api/v1/user
// endpoint for fetching user data from database

defineRouteMeta({
  openAPI: {
    // The $global block is merged into the root of the generated document by
    // Nitro. It is declared here once for the whole API - if this route is
    // ever removed, move the block to another handler or the published spec
    // loses its security schemes.
    $global: {
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            description:
              'Firebase ID token. server/middleware/auth.ts exchanges it for the _token cookie ' +
              'on first use.',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: '_token',
            description:
              'httpOnly cookie set from a bearer token, valid for one day. Interchangeable with ' +
              'bearerAuth.',
          },
        },
      },
    },
    tags: ['User'],
    summary: 'Fetch current user or list all users',
    description:
      'Returns the authenticated user by default. scope=all lists every user and requires admin.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'scope',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['all'] },
        description: 'Admin only. Lists all users.',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'User, or map of UID to User when scope=all' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    //   404: { description: 'Error (user/not-found).' },
    // },
  },
})

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
  // TODO! Restrict company user access by adding custom endpoint for /api/v1/company/events/users
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
