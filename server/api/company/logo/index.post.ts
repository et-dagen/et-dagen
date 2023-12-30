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

  if (!hasAccess(user, ['admin']) && user.companyUID !== companyUID)
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  if (!file || !companyUID)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing file, company UID or name',
    })

  const fileExtension = file.filename?.split('.').pop() || ''
  const getFileContentTypeFromExtension = (fileExtension: string) => {
    switch (fileExtension) {
      case 'png':
        return 'image/png'
        break
      case 'jpg':
        return 'image/jpeg'
        break
      case 'jpeg':
        return 'image/jpeg'
        break
      case 'svg':
        return 'image/svg+xml'
        break
      default:
        return null
    }
  }
  const fileContentType = getFileContentTypeFromExtension(fileExtension)

  if (!fileContentType)
    throw createError({
      statusCode: 400,
      statusMessage: 'Firebase: Error (storage/unsupported-file-type).',
    })

  const bucket = storage.bucket()
  const filePath = `companies/${companyUID}/logo.${fileExtension}`
  const fileRef = bucket.file(filePath)

  const imageBuffer = Buffer.from(file.data)

  const options = {
    resumable: false,
    public: true,
  }
  await fileRef.save(imageBuffer, options).catch(() => {
    sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: 'Firebase: Error (storage/cannot-upload-file).',
      })
    )
  })

  const URL = `https://storage.googleapis.com/${bucket.name}/${filePath}`
  return {
    URL,
  }
})
