// GET /api/v1/event
// endpoint for fetching events from db

defineRouteMeta({
  openAPI: {
    tags: ['Event'],
    summary: 'List events or fetch one',
    description:
      'Public. Without eventUID returns every event keyed by UID; with it returns a single-entry ' +
      'map.',
    security: [],
    parameters: [
      {
        name: 'eventUID',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Omit to list all events',
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'Map of event UID to Event, or null' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { eventUID } = getQuery(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'event',
    eventUID as string | undefined,
    eventUID ? 'get' : 'list',
    eventUID ? 'Fetch single event' : 'List all events',
  )

  const eventsRef = db.ref('events')

  // return all events if no event is specified
  if (!eventUID) {
    const snapshot = await withDbTiming(event, 'events', 'read', () =>
      eventsRef.orderByKey().once('value'),
    )
    const data = snapshot.val()

    // Add result metadata to wide event
    addEventContext(event, 'result_count', data ? Object.keys(data).length : 0)

    return data
  }

  // get specified event
  const snapshot = await withDbTiming(event, `events/${eventUID}`, 'read', () =>
    eventsRef
      .orderByKey()
      .equalTo(eventUID as string)
      .once('value'),
  )

  const data = snapshot.val()

  // Track whether event was found
  addEventContext(event, 'event_found', !!data)

  return data
})
