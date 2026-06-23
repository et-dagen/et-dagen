// PATCH /api/event/attended
// Admin-only: set attended = true/false for an attendant

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { eventUID, userUID, attended } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'event',
    eventUID,
    'update',
    'Set attendance status for attendant',
  )
  setLogImportance(event, 'warn')

  if (!user || !hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'event/attended/not-admin',
      message: 'Non-admin user attempted to set attendance',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (event/attended/not-admin).',
    })
  }

  if (!eventUID || !userUID || typeof attended !== 'boolean') {
    setErrorContext(event, {
      code: 'event/attended/invalid-payload',
      message: 'Invalid attendance payload',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/attended/invalid-payload).',
    })
  }

  const eventRef = db.ref(`events/${eventUID}`)
  const snapshot = await withDbTiming(event, `events/${eventUID}`, 'read', () =>
    eventRef.once('value'),
  )
  const data = snapshot.val()

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

  if (!Object.hasOwn(data.attendants ?? {}, userUID)) {
    setErrorContext(event, {
      code: 'event/attended/user-not-attendant',
      message: 'Target user is not an attendant',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/attended/user-not-attendant).',
    })
  }

  await withDbTiming(
    event,
    `events/${eventUID}/attendants/${userUID}/attended`,
    'write',
    () =>
      eventRef
        .child('attendants')
        .child(userUID)
        .child('attended')
        .set(attended),
  )

  addEventContext(event, 'attended', attended)

  sendNoContent(event, 204)
})
