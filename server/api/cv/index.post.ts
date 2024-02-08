// POST /api/cv
// endpoint for inserting pdf into storage bucket

export default eventHandler(async (event) => {
  const { user } = event.context

  // get request body
  const body = await readBody(event)

  // check if user is authorized
  if (!hasAccess(user, ['basic']))
    throw createError({
      statusCode: 400,
      statusMessage: 'User not authorized',
    })

  if (body.userUID !== user.UID)
    throw createError({
      statusCode: 401,
      statusMessage: 'Cannot upload to other users',
    })

  // check if body content is defined
  if (!body.file || !body.user || !body.userUID)
    throw createError({
      statusCode: 402,
      statusMessage: 'Firebase: Error (storage/data-not-defined)',
    })

  // check if file is correct type (only pdf is allowed)
  if (body.file.type !== 'document/pdf') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Firebase: Error (storage/unsupported-file-type)',
    })
  }

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `${body.storagePath}/${body.file.filename}`
  const fileRef = bucket.file(filePath)

  // create new buffer
  const documentBuffer = Buffer.from(body.file.data)

  const options = {
    resumable: false,
    public: true,
  }

  // save pdf buffer to created reference
  await fileRef.save(documentBuffer, options).catch(() => {
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Firebase: Error (storage/cannot-upload-file).',
      })
    )
  })

  // return public url of pdf
  const URL = `https://storage.googleapis.com/${bucket.name}/${body.filePath}`
  return {
    URL,
  }
})
