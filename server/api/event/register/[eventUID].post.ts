// POST /api/event/register/:eventUID
// endpoint for signing up for an event
export default defineEventHandler(async (event) => {
  const { user } = event.context
  const eventUID = getRouterParam(event, 'eventUID') as string

  // user is not authenticated
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Firebase: Error (auth/user-not-found).',
    })
  }

  // eventUID is not provided
  if (!eventUID) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Events: Error (event/missing-event-id).',
    })
  }

  // Get event from database
  const eventsRef = db.ref('events')
  const snapshot = await eventsRef.orderByKey().equalTo(eventUID).once('value')
  const data = snapshot.val()

  // Event does not exist
  if (!data || !data[eventUID]) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (event/event-doesnt-exists).',
    })
  }

  if (!data[eventUID].limitedCapacity || !data[eventUID].capacity) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (register/registration-unnecessary).',
    })
  }

  // Event does not have attendants
  if (!Object.hasOwn(data[eventUID], 'attendants')) {
    eventsRef.child(eventUID).child('attendants').push(user.uid)
    sendNoContent(event, 201)
  }

  // User is already registered for this event
  if (Object.values(data[eventUID].attendants).includes(user.uid)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (register/already-registered).',
    })
  }

  // Event is full
  if (
    Object.values(data[eventUID].attendants).length >= data[eventUID]?.capacity
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (register/event-is-full).',
    })
  }

  // Add user to attendants
  eventsRef.child(eventUID).child('attendants').push(user.uid)

  // User successfully registered for event
  sendNoContent(event, 201)
})
