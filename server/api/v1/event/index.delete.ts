// DELETE /api/v1/event
// Endpoint for deleting existing events

defineRouteMeta({
  openAPI: {
    tags: ['Event'],
    summary: 'Delete existing event',
    description:
      'Admin, or the owning company user. companyUID is used for the ownership check.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // requestBody: {
    //   required: true,
    //   content: {
    //     'application/json': {
    //       schema: {
    //         type: 'object',
    //         required: ['eventUID'],
    //         properties: {
    //           eventUID: { type: 'string' },
    //           companyUID: { type: 'string' },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Removed' },
    //   400: { description: 'Error (event/missing-event-uid).' },
    //   401: { description: 'Error (event/not-owner). or Error (firebase/user-not-authorized).' },
    // },
  },
})

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
