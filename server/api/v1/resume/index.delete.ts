// DELETE /api/v1/resume
// endpoint for deleting existing resumes

defineRouteMeta({
  openAPI: {
    tags: ['Resume'],
    summary: 'Delete user resume',
    description:
      'Users may delete their own resume; admins may delete the resume of any ' +
      'user. Uses 402 when the user has no resume.',
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
    //   400: { description: 'User not authorized' },
    //   401: { description: 'User can only delete their own resume' },
    //   402: { description: 'User does not have a resume' },
    //   500: { description: 'Firebase: Error (storage/cannot-delete-file).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'resume', undefined, 'delete', 'Delete user resume')
  setLogImportance(event, 'warn')

  if (!hasAccess(user, ['basic', 'admin'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'User not authorized',
    })
  }

  const { userUID } = await readBody(event)

  addEventContext(event, 'user_uid', userUID)

  if (userUID !== user.uid) {
    setErrorContext(event, {
      code: 'storage/cannot-delete-other-users',
      message: 'User can only delete their own resume',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'User can only delete their own resume',
    })
  }

  const file = user.resume.split('/')

  if (!file) {
    setErrorContext(event, {
      code: 'storage/no-resume',
      message: 'User does not have a resume',
    })
    throw createError({
      statusCode: 402,
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
