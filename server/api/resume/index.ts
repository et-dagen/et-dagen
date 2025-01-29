// GET /api/job
// endpoint for fetching resumes from db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // check if user is authorized
  if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 400,
      statusMessage: 'User not authorized',
    })

  const userUID = user.uid

  // get storage bucket
  const bucket = storage.bucket()
  const filePath = `users/${userUID}/resume.pdf`
  const fileRef = bucket.file(filePath)

  // check if file exists
  const [exists] = await fileRef.exists()
  if (!exists) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Resume not found',
    })
  }

  // get public url of pdf
  const URL = `https://storage.googleapis.com/${bucket.name}/${filePath}`

  return { url: URL }
})
