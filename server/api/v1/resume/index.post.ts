// POST /api/v1/resume
// endpoint for storing a user's resume

import { uploadResume } from '@/application/users/resume'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { files, fileStorage, resumes } from '@/server/composition'

defineRouteMeta({
  openAPI: {
    tags: ['Resume'],
    summary: 'Upload user resume',
    description:
      'PDF only. Multipart parts are read POSITIONALLY, not by name - part 0 must be the file ' +
      'and part 1 the userUID. Returns the id of the stored file as a bare string, not an ' +
      'object. Replaces any earlier resume. Uses 400 for missing data.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'multipart/form-data': {
    //       schema: {
    //         type: 'object',
    //         properties: {
    //           file: { type: 'string', format: 'binary', description: 'Part 0. application/pdf only.' },
    //           userUID: { type: 'string', description: 'Part 1.' },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   200: { description: 'File id as a bare string', content: { 'application/json': { schema: { type: 'string' } } } },
    //   400: { description: 'file/unsupported-type, file/empty or file/too-large' },
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'resume', undefined, 'create', 'Upload user resume')
  setLogImportance(event, 'warn')

  // get request body
  const body = await readMultipartFormData(event)
  const file = body?.[0]
  const userUID = body?.[1]?.data.toString()

  addEventContext(event, 'user_uid', userUID)

  // check if body content is defined
  if (!file || !userUID) {
    setErrorContext(event, {
      code: 'storage/data-not-defined',
      message: 'Required resume data is missing',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Firebase: Error (storage/data-not-defined)',
    })
  }
  addEventContext(event, 'file_size', file.data.byteLength)

  const stored = await uploadResume(
    { files, storage: fileStorage, resumes, now: Instant.now },
    {
      subject,
      now: Instant.now(),
      owner: UserUid.parse(userUID),
      name: file.filename ?? 'resume.pdf',
      contentType: file.type ?? '',
      bytes: new Uint8Array(file.data),
    },
  )
  return stored.id
})
