// GET /api/v1/user
// endpoint for fetching user data from database

import { hasPermission } from '@/domain/authorization/hasPermission'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { access } from '@/server/composition'
import { membershipBodyOf } from '@/contracts/user'

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
              'Firebase ID token, verified and checked for revocation on every request.',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: '__session',
            description:
              'Session cookie from POST /api/v1/session: HttpOnly, SameSite=Strict, two weeks, ' +
              'checked for revocation on every request.',
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
  const { decodedToken, subject, user } = event.context

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

  if (!user || !subject) {
    setErrorContext(event, {
      code: 'user/not-found',
      message: 'User not found in database',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (user/not-found).',
    })
  }

  if (!isListRequest) {
    addEventContext(event, 'returned_self', true)
    return user
  }

  // listing other users' personal data is kept for the audit trail
  setLogImportance(event, 'warn')

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

  const env = { now: Instant.now() }
  const visible = visibleUsers(
    subject,
    users,
    (
      await withDbTiming(event, 'events', 'read', () =>
        db.ref('events').once('value'),
      )
    ).val() ?? {},
    env,
  )
  addEventContext(event, 'result_count', visible.length)

  // admins see stored roles and memberships; users not migrated yet have none (#640)
  if (!hasPermission(subject, 'user', 'assign', { scope: 'all' }, env))
    return visible
  const stored = await access.all()
  return visible.map((user) => {
    const held = stored.get(UserUid.parse(user.uid as string))
    return held
      ? {
          ...user,
          access: {
            roles: held.roles,
            memberships: held.memberships.map(membershipBodyOf),
          },
        }
      : user
  })
})
