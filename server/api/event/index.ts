// GET /api/event
// endpoint for fetching events from db

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
