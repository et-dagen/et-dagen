// GET /api/v1/company/events
// endpoint for fetching all company events from db

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'List company events',
    description:
      'Admin sees all events; a company user sees only their own and must supply companyUID.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'companyUID',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Required for company users, optional for admins',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'Map of event UID to Event, or null' },
    //   400: { description: 'Error (company/require-company-uid).' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { companyUID } = getQuery(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'company_event',
    companyUID as string | undefined,
    'list',
    'List company events',
  )

  // check if user is authorized
  if (!hasAccess(user, ['admin', 'company'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to list company events',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  const eventsRef = db.ref('events')

  // company user must specify companyUID
  if (!companyUID && !hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'company/require-company-uid',
      message: 'Company ID required',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (company/require-company-uid).',
    })
  }

  // fetch accessible events for user
  const snapshot = hasAccess(user, ['admin'])
    ? await withDbTiming(event, 'events', 'read', () =>
        eventsRef.orderByKey().once('value'),
      )
    : await withDbTiming(event, `events?companyUID=${companyUID}`, 'read', () =>
        eventsRef
          .orderByChild('companyUID')
          .equalTo(companyUID as string)
          .once('value'),
      )

  const data = snapshot.val()

  // Add result metadata to wide event
  addEventContext(event, 'result_count', data ? Object.keys(data).length : 0)

  return data
})
