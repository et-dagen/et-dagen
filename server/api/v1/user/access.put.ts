// PUT /api/v1/user/access
// endpoint for setting a user's roles and company memberships
import { assignAccess } from '@/application/users/access'
import { checkedAccess } from '@/domain/authorization/access'
import { fail } from '@/domain/errors'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { access, companies, users } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: "Set a user's roles and memberships",
    description:
      'Admin only. Body: `{ uid, roles, memberships: [{ companyUID, kind }] }`, where `kind` is ' +
      '`employee` (needs the `company` role) or `coordinator` (needs the `coordinator` role). ' +
      'Replaces what the user had; a membership left out is ended.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const body = await readBody(event)
  setResourceContext(
    event,
    'user',
    body?.uid,
    'assign',
    "Set a user's roles and memberships",
  )
  setLogImportance(event, 'warn')

  const input = checkedAccess(body)
  if ('problem' in input) throw fail(input.problem)
  if (typeof body.uid !== 'string' || body.uid === '')
    throw fail('user/invalid-access')

  addEventContext(event, 'roles', input.roles.join(','))
  addEventContext(event, 'membership_count', input.memberships.length)

  await assignAccess(
    { access, users, companies },
    {
      subject,
      user: UserUid.parse(body.uid),
      access: input,
      now: Instant.now(),
    },
  )
  sendNoContent(event, 204)
})
