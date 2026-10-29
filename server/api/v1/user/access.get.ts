// GET /api/v1/user/access
// endpoint for a user's roles and company memberships
import { accessOf } from '@/application/users/access'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { access, profiles } from '@/server/composition'
import { membershipBodyOf } from '@/contracts/user'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: "Get a user's roles and memberships",
    description:
      'Admin only. Query: `uid`. Returns ' +
      '`{ roles, memberships: [{ companyUID, kind, withheld? }] }` in the shape ' +
      '`PUT /api/v1/user/access` takes.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const { uid } = getQuery(event)
  setResourceContext(
    event,
    'user',
    typeof uid === 'string' ? uid : undefined,
    'get',
    "Get a user's roles and memberships",
  )

  if (typeof uid !== 'string' || uid === '') throw fail('user/invalid-access')

  const found = await accessOf(
    { access, profiles },
    { subject, user: UserUid.parse(uid), now: Instant.now() },
  )
  return {
    roles: found.roles,
    memberships: found.memberships.map(membershipBodyOf),
  }
})
