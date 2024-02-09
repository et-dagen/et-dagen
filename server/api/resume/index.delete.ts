// DELETE /api/resume
// endpoint for deleting existing resumes

export default defineEventHandler(async (event) => {
  const { user } = event.context

  if (!hasAccess(user, ['basic', 'admin']))
    throw createError({
      statusCode: 400,
      statusMessage: 'User not authorized',
    })

  const { userUID } = await readBody(event)

  if (userUID !== user.uid)
    throw createError({
      statusCode: 401,
      statusMessage: 'User can only delete their own resume',
    })

  const file = user.resume

  if (!file)
    throw createError({
      statusCode: 402,
      statusMessage: 'User does not have a resume',
    })

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `users/${userUID}/${file.filename}`
  const fileRef = bucket.file(filePath)

  // delete pdf buffer at reference
  await fileRef.delete().catch(() => {
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Firebase: Error (storage/cannot-delete-file).',
      })
    )
  })

  const userRef = db.ref('users')
  userRef.child('resume').remove()

  sendNoContent(event, 204)
})
