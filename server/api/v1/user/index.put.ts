// PUT /api/v1/user
// endpoint for updating the name of a user in the database

import { authorize } from '@/domain/authorization/authorize'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Update user profile',
    description:
      'Authenticated users may update themselves. Targeting another uid requires admin.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         properties: { uid: { type: 'string', description: 'Admin only' } },
    //         additionalProperties: true,
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Updated' },
    //   401: { description: 'Error (firebase/not-signed-in). or Error (firebase/user-not-authorized).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const { uid, ...newData } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(event, 'user', uid, 'update', 'Update user profile')
  setLogImportance(event, 'warn')

  const target = typeof uid === 'string' && uid ? UserUid.parse(uid) : undefined
  authorize(
    subject,
    'user',
    'update',
    { uid: target, scope: target === subject?.uid ? 'own' : 'all' },
    { now: Instant.now() },
  )
  addEventContext(event, 'is_admin_action', target !== subject.uid)

  const displayName = newData.name
  const newEmail = newData.email
  // update name with ID
  await auth.updateUser(uid, { displayName, email: newEmail })
  trackDbWrite(event, `auth/users/${uid}`)

  // a session keeps the name it started with, and the stored name is read before it
  if (typeof displayName === 'string' && displayName.trim()) {
    await db.ref(`users/${uid}/name`).set(displayName)
    trackDbWrite(event, `users/${uid}/name`)
  }

  // send response to remove cookie
  sendNoContent(event, 204)
})
