// DELETE /api/v1/resume
// endpoint for deleting existing resumes

import { authorize } from '@/domain/authorization/authorize'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

defineRouteMeta({
  openAPI: {
    tags: ['Resume'],
    summary: 'Delete user resume',
    description:
      'Users may delete their own resume; admins may delete the resume of any ' +
      'user. Uses 404 when the user has no resume.',
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
    //         properties: { userUID: { type: 'string' } },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Deleted' },
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    //   404: { description: 'User does not have a resume' },
    //   500: { description: 'Firebase: Error (storage/cannot-delete-file).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'resume', undefined, 'delete', 'Delete user resume')
  setLogImportance(event, 'warn')

  const { userUID } = await readBody(event)

  addEventContext(event, 'user_uid', userUID)

  authorize(
    subject,
    'resume',
    'write',
    {
      ownerUid:
        typeof userUID === 'string' && userUID
          ? UserUid.parse(userUID)
          : undefined,
      scope: 'own',
    },
    { now: Instant.now() },
  )

  const stored = await withDbTiming(
    event,
    `users/${userUID}/resume`,
    'read',
    () => db.ref(`users/${userUID}/resume`).once('value'),
  )
  const file = typeof stored.val() === 'string' ? stored.val().split('/') : null

  if (!file) {
    setErrorContext(event, {
      code: 'storage/no-resume',
      message: 'User does not have a resume',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'User does not have a resume',
    })
  }

  // Get last element in array to get specific file name
  const filename = file[file.length - 1]

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `users/${userUID}/${filename}`
  const fileRef = bucket.file(filePath)

  // delete pdf buffer at reference
  await withDbTiming(event, filePath, 'delete', () =>
    fileRef.delete().catch(() => {
      sendError(
        event,
        createError({
          statusCode: 500,
          statusMessage: 'Firebase: Error (storage/cannot-delete-file).',
        }),
      )
    }),
  )

  // Delete file reference from database
  const userRef = db.ref('users')
  userRef.child(userUID).child('resume').remove()
  trackDbDelete(event, `users/${userUID}/resume`)

  sendNoContent(event, 204)
})
