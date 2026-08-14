// DELETE /api/v1/event
// Endpoint for deleting existing events

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { eventUID, companyUID } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'event',
    eventUID,
    'delete',
    'Delete existing event',
  )
  setLogImportance(event, 'warn')

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user.companyUID !== companyUID) {
      setErrorContext(event, {
        code: 'event/not-owner',
        message: 'Company user does not own this event',
      })
      throw createError({
        statusCode: 401,
        statusMessage: 'Error (event/not-owner).',
      })
    }
  } else if (!hasAccess(user, ['admin'])) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to delete event',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  // Check if input is valid
  if (!eventUID) {
    setErrorContext(event, {
      code: 'event/missing-event-uid',
      message: 'Event UID not provided',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/missing-event-uid).',
    })
  }

  // Reference to events
  const eventsRef = db.ref('events')

  // Remove event from database
  eventsRef.child(eventUID).remove()
  trackDbDelete(event, `events/${eventUID}`)

  // Event removed successfully
  sendNoContent(event, 204)
})
