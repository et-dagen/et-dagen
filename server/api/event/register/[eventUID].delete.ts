// DELETE /api/event/register/:eventUID
// endpoint for opting out of an event
export default defineEventHandler(async (event) => {
  const { user } = event.context
  const eventUID = getRouterParam(event, 'eventUID') as string

  // user is not authenticated
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Firebase: Error (auth/user-not-found).',
    })
  }

  // eventUID is not provided
  if (!eventUID) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event: Error (event/missing-event-id).',
    })
  }

  // Get event from database
  const attendantsRef = db.ref('events')
  const snapshot = await attendantsRef
    .orderByKey()
    .equalTo(eventUID)
    .once('value')
  const data = snapshot.val()

  // Event does not exist
  if (!data || !data[eventUID]) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (event/event-doesnt-exists).',
    })
  }

  // Get attendee key for user
  const attendees = data[eventUID].attendants
  const attendantUID: string | undefined = Object.entries(attendees ?? {}).find(
    (attendant) => attendant[1] === user.uid
  )?.[0]

  // User is not registered for this event
  if (attendantUID === undefined) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (register/user-not-registered).',
    })
  }

  // Remove user from attendants
  delete attendees[attendantUID]

  // Update attendants
  attendantsRef.child(eventUID).child('attendants').set(attendees)

  // User successfully opted out of event
  sendNoContent(event, 201)
})
