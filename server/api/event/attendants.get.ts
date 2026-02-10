// GET /api/event/attendants
// Admin-only: get a list of attendant emails for a given event

export default defineEventHandler(async (event) => {
  const { user } = event.context

  if (!user || !hasAccess(user, ['admin'])) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (event/attendants/not-admin).',
    })
  }

  const { eventUID } = getQuery(event)

  if (!eventUID) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/attendants/missing-event-uid).',
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

  const attendantUIDs = Object.keys(data.attendants ?? {})

  const emails = await Promise.all(
    attendantUIDs.map(async (uid) => {
      try {
        const firebaseUser = await auth.getUser(uid)
        return firebaseUser.email ?? null
      } catch {
        return null
      }
    }),
  )

  return {
    eventName: data.title ?? null,
    emails: emails.filter((email) => email !== null),
  }
})
