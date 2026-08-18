// POST /api/v1/company
// endpoint for creating companies in the db

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'Create company',
    description:
      'Admin only. Note the request field is named `type`, while models/Company.ts calls it ' +
      '`companyType`.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         required: ['name', 'webpage', 'type'],
    //         properties: {
    //           name: { type: 'string' },
    //           webpage: { type: 'string' },
    //           type: {
    //             type: 'string',
    //             enum: ['main-partner', 'partner', 'sponsor', 'old'],
    //           },
    //           description: { type: 'string', nullable: true },
    //           logo: { type: 'string', nullable: true },
    //           cvAccess: { type: 'boolean' },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   200: { description: 'Created. Returns { companyUID }' },
    //   400: { description: 'Error (company/missing-name-webpage-type).' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Set resource context for wide event logging
  setResourceContext(event, 'company', undefined, 'create', 'Create company')
  setLogImportance(event, 'warn')

  // only admins can create new companies
  if (!hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to create companies',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  const { description, logo, name, type, webpage, cvAccess } =
    await readBody(event)

  const companiesRef = db.ref('companies')

  // description and logo are not required, but should be set by a company admin
  if (!name || !webpage || !type) {
    setErrorContext(event, {
      code: 'company/missing-name-webpage-type',
      message: 'Name, webpage, or type not provided',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (company/missing-name-webpage-type).',
    })
  }

  const companyRef = companiesRef.push({
    description: description ?? null,
    logo: logo ?? null,
    name,
    type,
    webpage,
    cvAccess,
  })

  // Preserve the original await-on-commit while recording timing.
  // .key is read from the synchronous push reference below, so awaiting the
  // adopted promise here is only used for commit timing.
  await withDbTiming(event, 'companies', 'write', () =>
    Promise.resolve(companyRef),
  )

  addEventContext(event, 'created_company_uid', companyRef.key)

  return {
    companyUID: companyRef.key,
  }
})
