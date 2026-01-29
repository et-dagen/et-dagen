// POST /api/event/register/:eventUID

// endpoint for signing up for an event
export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { eventUID, userUID } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'event_registration',
    eventUID,
    'create',
    'Register user for event',
  )

  // user is not authenticated
  if (!user) {
    setErrorContext(event, {
      code: 'firebase/auth/user-not-found',
      message: 'User not authenticated',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/auth/user-not-found).',
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
  if (isAdminAction && !hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'event/register/non-admin-user',
      message: 'Non-admin user attempted to register another user',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (event/register/non-admin-user).',
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

  // Add event metadata to wide event
  addEventContext(event, 'event_capacity', data.capacity)
  addEventContext(
    event,
    'event_attendant_count',
    Object.keys(data.attendants ?? {}).length,
  )

  if (!data.capacity) {
    setErrorContext(event, {
      code: 'event/register/registration-unnecessary',
      message: 'Event does not require registration',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/registration-unnecessary).',
    })
  }

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

  if (userUID?.length) {
    await auth.getUser(userUID).catch(() => {
      setErrorContext(event, {
        code: 'user/doesnt-exist',
        message: 'Target user does not exist',
      })
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

  addEventContext(
    event,
    'meets_programme_requirement',
    meetsProgrammeRequirement,
  )
  addEventContext(event, 'meets_year_requirement', meetsYearRequirement)

  if (
    !hasAccess(user, ['admin']) &&
    (!meetsProgrammeRequirement || !meetsYearRequirement)
  ) {
    setErrorContext(event, {
      code: 'register/requirements-not-met',
      message: 'User does not meet registration requirements',
    })
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
    setErrorContext(event, {
      code: 'event/register/already-registered',
      message: 'User is already registered for this event',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/already-registered).',
    })
  }

  // Event is full
  if (Object.keys(attendants).length >= data.capacity) {
    // Check if the user is already in the queue
    if (Object.values(queue).includes(targetUID)) {
      setErrorContext(event, {
        code: 'event/register/already-queued',
        message: 'User is already in the queue',
      })
      throw createError({
        statusCode: 404,
        statusMessage: 'Error (event/register/already-queued).',
      })
    }

    const timestamp = Date.now().toString()

    await withDbTiming(
      event,
      `events/${eventUID}/queue/${timestamp}`,
      'write',
      () => eventRef.child('queue').child(timestamp).set(targetUID),
    )

    addEventContext(event, 'registration_outcome', 'queued')
    addEventContext(event, 'queue_position', Object.keys(queue).length + 1)

    sendNoContent(event, 201)
    return
  }

  // Add user to attendants
  await withDbTiming(
    event,
    `events/${eventUID}/attendants/${targetUID}`,
    'write',
    () =>
      eventRef.child('attendants').child(targetUID).set({
        attended: false,
        registeredAt: Date.now(),
      }),
  )

  addEventContext(event, 'registration_outcome', 'registered')

  // User successfully registered for event
  sendNoContent(event, 201)
})
