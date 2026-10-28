// GET /api/v1/user/subject
// endpoint for the caller's roles and company entitlements, as the permission table reads them

import { authorize } from '@/domain/authorization/authorize'
import { serializeSubject } from '@/domain/authorization/subject'
import { Instant } from '@/domain/time'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: "Get the caller's permissions",
    description:
      "The signed-in caller's roles, the entitlements of each company they act for, and the " +
      'student attributes eligibility rules read. The client asks the same permission table ' +
      'with it, so menus and route guards agree with the server.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
})

export default defineEventHandler((event) => {
  const { subject } = event.context
  setResourceContext(
    event,
    'user',
    subject?.uid,
    'get',
    "Get the caller's permissions",
  )

  authorize(
    subject,
    'user',
    'read',
    { uid: subject?.uid, scope: 'own' },
    { now: Instant.now() },
  )
  return serializeSubject(subject)
})
