// DELETE /api/event/register/:eventUID

// endpoint for opting out of an event
export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { eventUID, userUID } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'event_registration',
    eventUID,
    'delete',
    'Opt user out of event',
  )
  setLogImportance(event, 'warn')

  // user is not authenticated
  if (!user) {
    setErrorContext(event, {
      code: 'firebase/user-not-found',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-found).',
    })
  }

  // eventUID is not provided
  if (!eventUID) {
    setErrorContext(event, {
      code: 'event/missing-event-id',
      message: 'Event ID not provided',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/missing-event-id).',
    })
  }

  // Track if this is an admin action on behalf of another user
  const isAdminAction = userUID && userUID !== user.uid
  addEventContext(event, 'is_admin_action', isAdminAction)

  // Only admins can modify event attendants
  if (userUID && userUID !== user.uid && !hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'event/register/not-owner',
      message: 'Non-admin user attempted to opt out another user',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (event/register/not-owner).',
    })
  }

  // Get event from database
  const eventRef = db.ref(`events/${eventUID}`)
  const snapshot = await withDbTiming(event, `events/${eventUID}`, 'read', () =>
    eventRef.once('value'),
  )
  const data = snapshot.val()

  // Event does not exist
  if (!data) {
    setErrorContext(event, {
      code: 'event/not-found',
      message: 'Event not found',
    })
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
    setErrorContext(event, {
      code: 'event/register/registration-closed',
      message: 'Registration window is closed',
    })
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
    await withDbTiming(
      event,
      `events/${eventUID}/queue/${queueKey}`,
      'delete',
      () => eventRef.child('queue').child(queueKey).remove(),
    )
    addEventContext(event, 'optout_outcome', 'dequeued')
    sendNoContent(event, 201)
    return
  }

  if (!Object.hasOwn(attendants, targetUID)) {
    setErrorContext(event, {
      code: 'event/register/user-not-registered-or-queued',
      message: 'User is not registered or queued for this event',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/user-not-registered-or-queued).',
    })
  }

  await withDbTiming(
    event,
    `events/${eventUID}/attendants/${targetUID}`,
    'delete',
    () => eventRef.child('attendants').child(targetUID).remove(),
  )

  addEventContext(event, 'optout_outcome', 'unregistered')

  // Move the next user from the queue to attendants
  const nextQueueKey = Object.keys(queue).sort()[0]

  if (nextQueueKey) {
    const nextUID = queue[nextQueueKey]

    await withDbTiming(
      event,
      `events/${eventUID}/queue/${nextQueueKey}`,
      'delete',
      () => eventRef.child('queue').child(nextQueueKey).remove(),
    )

    await withDbTiming(
      event,
      `events/${eventUID}/attendants/${nextUID}`,
      'write',
      () =>
        eventRef.child('attendants').child(nextUID).set({
          attended: false,
          registeredAt: Date.now(),
        }),
    )

    addEventContext(event, 'queue_promoted', true)
  }

  // User successfully opted out of event
  sendNoContent(event, 201)
})
