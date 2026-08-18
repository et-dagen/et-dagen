// GET /api/v1/company
// endpoint for fetching companies from db

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'List companies or fetch one',
    description:
      'Public. Without companyUID returns every company keyed by UID; with it returns a ' +
      'single-entry map. Returns null when empty.',
    security: [],
    parameters: [
      {
        name: 'companyUID',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Omit to list all companies',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'Map of company UID to Company, or null' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { companyUID } = getQuery(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'company',
    companyUID as string | undefined,
    companyUID ? 'get' : 'list',
    companyUID ? 'Fetch single company' : 'List all companies',
  )
  setLogImportance(event, 'debug')

  const companiesRef = db.ref('companies')

  // return all companies if no company is specified
  if (!companyUID) {
    const snapshot = await withDbTiming(event, 'companies', 'read', () =>
      companiesRef.orderByKey().once('value'),
    )
    const data = snapshot.val()

    // Add result metadata to wide event
    addEventContext(event, 'result_count', data ? Object.keys(data).length : 0)

    return data
  }

  // get specified company
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

  // Track whether company was found
  addEventContext(event, 'company_found', !!data)

  return data
})
