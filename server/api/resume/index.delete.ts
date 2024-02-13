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

  // console.log('USER RESUME: ', user.resume)

  const file = user.resume

  console.log(`FILE INFO: ${file}`)

  // const documentBuffer = Buffer.from(file.data)

  if (!file)
    throw createError({
      statusCode: 402,
      statusMessage: 'User does not have a resume',
    })

  const filename = file.split('/')[-1]

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `users/${userUID}/${filename}`
  const fileRef = bucket.file(filePath)

  console.log(`FILEREF NAME: ${fileRef}`)

  // delete pdf buffer at reference
  try {
    await fileRef.delete()
  } catch (error) {
    // console.error('Error deleting file:', error)
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Firebase: Error (storage/cannot-delete-file).',
      })
    )
  }

  // const userRef = db.ref('users')
  // userRef.child(userUID).child('resume').remove()

  sendNoContent(event, 204)
})
