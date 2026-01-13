// POST /api/event/register/:eventUID

// endpoint for signing up for an event
export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { eventUID, userUID } = await readBody(event)

  // user is not authenticated
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/auth/user-not-found).',
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
      statusMessage: 'Error (event/register/non-admin-user).',
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

  if (!data.capacity) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/registration-unnecessary).',
    })
  }

  if (
    !hasAccess(user, ['admin']) &&
    !presentWithinTimeWindow(data.registration.start, data.registration.end)
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/registration-closed).',
    })
  }

  if (userUID?.length) {
    await auth.getUser(userUID).catch(() => {
      throw createError({
        statusCode: 401,
        statusMessage: 'Error (user/doesnt-exist).',
      })
    })
  }

  // check if user meets registration requirements
  const meetsProgrammeRequirement =
    data?.registration?.requirements?.programmes?.includes(user.studyProgram) ??
    true

  const meetsYearRequirement =
    data?.registration?.requirements?.years?.includes(user.currentYear) ?? true

  if (
    !hasAccess(user, ['admin']) &&
    (!meetsProgrammeRequirement || !meetsYearRequirement)
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (register/requirements-not-met).',
    })
  }

  const attendants = data.attendants ?? {}
  const queue = data.queue ?? {}

  const targetUID = userUID ?? user.uid

  // User is already registered for this event
  if (Object.hasOwn(attendants, targetUID)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/already-registered).',
    })
  }

  // Event is full
  if (Object.keys(attendants).length >= data.capacity) {
    // Check if the user is already in the queue
    if (Object.values(queue).includes(targetUID)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Error (event/register/already-queued).',
      })
    }

    const timestamp = Date.now().toString()

    await eventRef.child('queue').child(timestamp).set(targetUID)
    sendNoContent(event, 201)
    return
  }

  // Add user to attendants
  await eventRef.child('attendants').child(targetUID).set({
    attended: false,
    registeredAt: Date.now(),
  })

  // User successfully registered for event
  sendNoContent(event, 201)
})
