// GET /api/v1/code
// endpoint for retrieving codes in the db

import { authorize } from '@/domain/authorization/authorize'
import { Instant } from '@/domain/time'

defineRouteMeta({
  openAPI: {
    tags: ['Code', 'internal'],
    summary: 'List registration codes',
    description:
      'Returns every registration code keyed by its database UID. Admin only.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'Map of code UID to { code, companyUID }' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    //   404: { description: 'Error (code/not-found). No codes exist.' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'code',
    undefined,
    'list',
    'List registration codes',
  )
  // registration codes turn an account into a company account: always logged
  setLogImportance(event, 'warn')

  authorize(subject, 'code', 'read', undefined, { now: Instant.now() })

  // reference to companies
  const registrationCodesRef = db.ref('registrationCodes')

  const snapshot = await withDbTiming(event, 'registrationCodes', 'read', () =>
    registrationCodesRef.orderByKey().once('value'),
  )
  const data = snapshot.val()

  if (!data) {
    setErrorContext(event, {
      code: 'code/not-found',
      message: 'No registration codes found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (code/not-found).',
    })
  }

  addEventContext(event, 'code_count', Object.keys(data).length)

  return data
})
