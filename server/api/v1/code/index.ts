// GET /api/v1/code
// endpoint for retrieving codes in the db

defineRouteMeta({
  openAPI: {
    tags: ['Code'],
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
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'code',
    undefined,
    'list',
    'List registration codes',
  )
  setLogImportance(event, 'debug')

  // only admins can create new registration codes
  if (!hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to list registration codes',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

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
