// DELETE /api/event/register/:eventUID

// endpoint for opting out of an event
export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { eventUID, userUID } = await readBody(event)

  // user is not authenticated
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-found).',
    })
  }

  // eventUID is not provided
  if (!eventUID) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/missing-event-id).',
    })
  }

  // Only admins can modify event attendants
  if (userUID && userUID !== user.uid && !hasAccess(user, ['admin'])) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (event/register/not-owner).',
    })
  }

  // Get event from database
  const eventRef = db.ref(`events/${eventUID}`)
  const snapshot = await eventRef.once('value')
  const data = snapshot.val()

  // Event does not exist
  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/not-found).',
    })
  }

  // check if sign up start and opt out deadline is before event start
  if (
    !hasAccess(user, ['admin']) &&
    !presentWithinTimeWindow(data.registration.start, data.registration.end)
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/registration-closed).',
    })
  }

  const attendants = data.attendants ?? {}
  const targetUID = userUID ?? user.uid
  const queue = data.queue ?? {}

  const queuedEntry = Object.entries(queue).find(([, uid]) => uid === targetUID)

  if (queuedEntry) {
    const [queueKey] = queuedEntry
    await eventRef.child('queue').child(queueKey).remove()
    sendNoContent(event, 201)
    return
  }

  if (!Object.hasOwn(attendants, targetUID)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/user-not-registered-or-queued).',
    })
  }

  await eventRef.child('attendants').child(targetUID).remove()

  // Move the next user from the queue to attendants
  const nextQueueKey = Object.keys(queue).sort()[0]

  if (nextQueueKey) {
    const nextUID = queue[nextQueueKey]

    await eventRef.child('queue').child(nextQueueKey).remove()

    await eventRef.child('attendants').child(nextUID).set({
      attended: false,
      registeredAt: Date.now(),
    })
  }

  // User successfully opted out of event
  sendNoContent(event, 201)
})
