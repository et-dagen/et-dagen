// POST /api/v1/image
// endpoint for posting an image to storage bucket

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'image',
    undefined,
    'upload',
    'Upload image to storage',
  )

  // only admins can post to storage bucket
  if (!hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User is not authorized to upload images',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  // get request body
  const formData = await readMultipartFormData(event)
  const file = formData?.[0]
  const storagePath = formData?.[1].data.toString()

  // if no file or companyUID
  if (!file || !storagePath) {
    setErrorContext(event, {
      code: 'firebase/storage/missing-file-or-path',
      message: 'Missing file or storage path in request',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (firebase/storage/missing-file-or-path',
    })
  }

  // check if file is correct type
  if (!(file.type === 'image/jpeg' || file.type === 'image/png')) {
    setErrorContext(event, {
      code: 'firebase/storage/unsupported-file-type',
      message: 'Uploaded file is not a supported image type',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (firebase/storage/unsupported-file-type).',
    })
  }

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `${storagePath}/${file.filename}`
  const fileRef = bucket.file(filePath)

  addEventContext(event, 'file_type', file.type)
  addEventContext(event, 'storage_path', filePath)

  // create new Buffer from FormData data buffer
  const imageBuffer = Buffer.from(file.data)

  const options = {
    resumable: false,
    public: true,
  }

  // save image buffer to the created reference
  await withDbTiming(event, filePath, 'write', () =>
    fileRef.save(imageBuffer, options),
  ).catch(() => {
    setErrorContext(event, {
      code: 'storage/cannot-upload-file',
      message: 'Failed to upload image to storage',
    })
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Error (storage/cannot-upload-file).',
      }),
    )
  })

  // return the public url of the image
  const URL = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  return {
    URL,
  }
})
