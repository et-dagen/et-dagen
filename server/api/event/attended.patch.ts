// PATCH /api/event/attended
// Admin-only: set attended = true/false for an attendant

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { eventUID, userUID, attended } = await readBody(event)

  if (!user || !hasAccess(user, ['admin'])) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (event/attended/not-admin).',
    })
  }

  if (!eventUID || !userUID || typeof attended !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/attended/invalid-payload).',
    })
  }

  const eventRef = db.ref(`events/${eventUID}`)
  const snapshot = await eventRef.once('value')
  const data = snapshot.val()

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/not-found).',
    })
  }

  if (!Object.hasOwn(data.attendants ?? {}, userUID)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (event/attended/user-not-attendant).',
    })
  }

  await eventRef
    .child('attendants')
    .child(userUID)
    .child('attended')
    .set(attended)

  sendNoContent(event, 204)
})
