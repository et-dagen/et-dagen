// GET /api/v1/company/events
// endpoint for fetching all company events from db

import { authorize } from '@/domain/authorization/authorize'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'

defineRouteMeta({
  openAPI: {
    tags: ['Company'],
    summary: 'List company events',
    description:
      'Admin sees all events. A company user or coordinator sees only the events of their own ' +
      'companies and must supply companyUID.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'companyUID',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description:
          'Required for company users and coordinators, who see only their own companies; ' +
          'admins leave it out to see every company',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'Map of event UID to Event, or null' },
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context
  const { companyUID } = getQuery(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'company_event',
    companyUID as string | undefined,
    'list',
    'List company events',
  )
  // includes who is registered for each event: always logged
  setLogImportance(event, 'warn')

  // without a company, every company's events
  const hosted =
    typeof companyUID === 'string' && companyUID !== ''
      ? { companyUid: CompanyUid.parse(companyUID) }
      : undefined
  authorize(subject, 'event', 'list', hosted, { now: Instant.now() })

  const eventsRef = db.ref('events')
  const snapshot = hosted
    ? await withDbTiming(
        event,
        `events?companyUID=${hosted.companyUid}`,
        'read',
        () =>
          eventsRef
            .orderByChild('companyUID')
            .equalTo(hosted.companyUid)
            .once('value'),
      )
    : await withDbTiming(event, 'events', 'read', () =>
        eventsRef.orderByKey().once('value'),
      )

  const data = snapshot.val()

  // Add result metadata to wide event
  addEventContext(event, 'result_count', data ? Object.keys(data).length : 0)

  return data
})
