// POST /api/company/logo
// endpoint for posting a company logo to storage db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // only admins can remove companies
  if (!hasAccess(user, ['admin', 'company']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // get request body
  const formData = await readMultipartFormData(event)
  const file = formData?.[0]
  const companyUID = formData?.[1].data.toString()

  // if no file or companyUID
  if (!file || !companyUID)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing file, company UID or name',
    })

  // check if company user, but of different company
  if (!hasAccess(user, ['admin']) && user.companyUID !== companyUID)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // get file extention
  const fileExtension = file.filename?.split('.').pop() || ''

  // get file contentType
  const getFileContentTypeFromExtension = (fileExtension: string) => {
    switch (fileExtension) {
      case 'png':
        return 'image/png'
      case 'jpg':
        return 'image/jpeg'
      case 'jpeg':
        return 'image/jpeg'
      case 'svg':
        return 'image/svg+xml'
      default:
        return null
    }
  }
  const fileContentType = getFileContentTypeFromExtension(fileExtension)

  // throw error on non-supported file type
  if (!fileContentType)
    throw createError({
      statusCode: 400,
      statusMessage: 'Firebase: Error (storage/unsupported-file-type).',
    })

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `companies/${companyUID}/logo.${fileExtension}`
  const fileRef = bucket.file(filePath)

  // create new Buffer from FormData data buffer
  const imageBuffer = Buffer.from(file.data)

  const options = {
    resumable: false,
    public: true,
  }

  // save image buffer to the created reference
  await fileRef.save(imageBuffer, options).catch(() => {
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Firebase: Error (storage/cannot-upload-file).',
      })
    )
  })

  // return the public url of the image
  const URL = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  return {
    URL,
  }
})
