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
  const eventsRef = db.ref('events')
  const snapshot = await eventsRef.orderByKey().equalTo(eventUID).once('value')
  const data = snapshot.val()

  // Event does not exist
  if (!data || !data[eventUID]) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/not-found).',
    })
  }

  if (!data[eventUID].capacity) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/registration-unnecessary).',
    })
  }

  if (
    !hasAccess(user, ['admin']) &&
    !presentWithinTimeWindow(
      data[eventUID].registration.start,
      data[eventUID].registration.end,
    )
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/registration-closed).',
    })
  }

  if (userUID?.length)
    await auth.getUser(userUID).catch(() => {
      throw createError({
        statusCode: 401,
        statusMessage: 'Error (user/doesnt-exist).',
      })
    })

  // check if user meets registration requirements
  const meetsProgrammeRequirement =
    data[eventUID]?.registration?.requirements?.programmes?.includes(
      user?.studyProgram,
    ) ?? true

  const meetsYearRequirement =
    data[eventUID]?.registration?.requirements?.years?.includes(
      user?.currentYear,
    ) ?? true

  if (
    !hasAccess(user, ['admin']) &&
    (!meetsProgrammeRequirement || !meetsYearRequirement)
  )
    throw createError({
      statusCode: 404,
      statusMessage: 'Events: Error (register/requirements-not-met).',
    })

  // Event does not have attendants
  if (!Object.hasOwn(data[eventUID], 'attendants')) {
    eventsRef
      .child(eventUID)
      .child('attendants')
      .push(userUID || user.uid)

    return sendNoContent(event, 201)
  }

  // User is already registered for this event
  if (Object.values(data[eventUID].attendants).includes(userUID || user.uid)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/register/already-registered).',
    })
  }

  // Event is full
  if (
    Object.values(data[eventUID].attendants).length >= data[eventUID]?.capacity
  ) {
    // Ensure queue subsection exists
    if (!data[eventUID].queue) {
      eventsRef.child(eventUID).child('queue').set({})
    }

    // Check if the user is already in the queue
    const queueSnapshot = await eventsRef
      .child(eventUID)
      .child('queue')
      .once('value')
    const queueData = queueSnapshot.val()
    if (queueData && Object.values(queueData).includes(userUID || user.uid)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User is already in the queue',
      })
    }

    // Add user to queue
    let timestamp = Date.now()
    let timestampString = timestamp.toString()
    let keyExists = true
    while (keyExists) {
      const snapshot = await eventsRef
        .child(eventUID)
        .child('queue')
        .child(timestampString)
        .once('value')
      if (snapshot.exists()) {
        timestamp = timestamp + 1
        timestampString = timestamp.toString()
      } else {
        keyExists = false
      }
    }
    eventsRef
      .child(eventUID)
      .child('queue')
      .child(timestampString)
      .set(userUID || user.uid)
    return sendNoContent(event, 201)
  }

  // Add user to attendants
  eventsRef
    .child(eventUID)
    .child('attendants')
    .push(userUID || user.uid)

  // User successfully registered for event
  sendNoContent(event, 201)
})
