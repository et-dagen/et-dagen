// POST /api/v1/code
// endpoint for creating registration codes in the db

defineRouteMeta({
  openAPI: {
    tags: ['Code'],
    summary: 'Create registration code',
    description:
      'Generates a code of the form <company-name>-<random8> for the given company. Admin only.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'companyUID',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: 'Company the code registers users to',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   201: { description: 'Created, empty body' },
    //   400: { description: 'Error (code/missing-company-uid).' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    //   404: { description: 'Error (company/not-found).' },
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
    'create',
    'Create registration code',
  )
  setLogImportance(event, 'warn')

  // only admins can create new registration codes
  if (!hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to create registration codes',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  const { companyUID } = getQuery(event)

  addEventContext(event, 'company_uid', companyUID)

  // companyUID is missing
  if (!companyUID) {
    setErrorContext(event, {
      code: 'code/missing-company-uid',
      message: 'Company UID not provided',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (code/missing-company-uid).',
    })
  }

  // reference to companies
  const companiesRef = db.ref('companies')

  // check if the company exists
  const snapshot = await withDbTiming(
    event,
    `companies/${companyUID}`,
    'read',
    () =>
      companiesRef
        .orderByKey()
        .equalTo(companyUID as string)
        .once('value'),
  )

  const data = snapshot.val()

  // the company does not exist in db
  if (!data) {
    setErrorContext(event, {
      code: 'company/not-found',
      message: 'Company not found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (company/not-found).',
    })
  }

  // reference to registration codes in db
  const registrationCodesRef = db.ref('registrationCodes')

  // create values for code
  const kebabCaseName = data[companyUID as string].name
    .replace(/\s+/g, '-')
    .toLowerCase()
  const randomString = generateRandomString(8)

  // create code in db
  registrationCodesRef.push({
    code: `${kebabCaseName}-${randomString}`,
    companyUID,
  })
  trackDbWrite(event, 'registrationCodes')

  addEventContext(event, 'created_code', `${kebabCaseName}-${randomString}`)

  // successfully created registration code
  sendNoContent(event, 201)
})
