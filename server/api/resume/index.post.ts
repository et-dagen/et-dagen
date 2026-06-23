// POST /api/resume
// endpoint for inserting pdf into storage bucket

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'resume', undefined, 'create', 'Upload user resume')
  setLogImportance(event, 'warn')

  // get request body
  const body = await readMultipartFormData(event)
  const file = body?.[0]
  const userUID = body?.[1].data.toString()

  addEventContext(event, 'user_uid', userUID)

  // check if user is authorized
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

  if (userUID !== user.uid) {
    setErrorContext(event, {
      code: 'storage/cannot-upload-to-other-users',
      message: 'Cannot upload resume to other users',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Cannot upload resume to other users',
    })
  }

  // check if body content is defined
  if (!file || !user || !userUID) {
    setErrorContext(event, {
      code: 'storage/data-not-defined',
      message: 'Required resume data is missing',
    })
    throw createError({
      statusCode: 402,
      statusMessage: 'Firebase: Error (storage/data-not-defined)',
    })
  }

  // check if file is correct type (only pdf is allowed)
  if (file.type !== 'application/pdf') {
    setErrorContext(event, {
      code: 'storage/unsupported-file-type',
      message: 'Unsupported file type, only pdf is allowed',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Firebase: Error (storage/unsupported-file-type)',
    })
  }

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `users/${userUID}/${file.filename}`
  const fileRef = bucket.file(filePath)

  // create new buffer
  const documentBuffer = Buffer.from(file.data)

  const options = {
    resumable: false,
    public: true,
  }

  // save pdf buffer to created reference
  await withDbTiming(event, filePath, 'write', () =>
    fileRef.save(documentBuffer, options).catch(() => {
      sendError(
        event,
        createError({
          statusCode: 500,
          statusMessage: 'Firebase: Error (storage/cannot-upload-file).',
        }),
      )
    }),
  )

  // return public url of pdf
  const URL = `https://storage.googleapis.com/${bucket.name}/${filePath}`

  const userRef = db.ref(`users/${userUID}`)

  userRef.update({ resume: URL })
  trackDbWrite(event, `users/${userUID}`)
  return URL
})
