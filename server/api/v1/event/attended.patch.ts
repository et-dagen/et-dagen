// PATCH /api/v1/event/attended
// Admin-only: set attended = true/false for an attendant

defineRouteMeta({
  openAPI: {
    tags: ['Event'],
    summary: 'Set attendance status for attendant',
    description:
      'Admin only. Marks a registered attendant as having attended, or reverses it.',
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
    //         required: ['eventUID', 'userUID', 'attended'],
    //         properties: {
    //           eventUID: { type: 'string' },
    //           userUID: { type: 'string' },
    //           attended: { type: 'boolean' },
    //         },
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Updated' },
    //   400: { description: 'Error (event/attended/invalid-payload).' },
    //   401: { description: 'Error (event/attended/not-admin).' },
    //   404: { description: 'Error (event/not-found). or Error (event/attended/user-not-attendant).' },
    // },
  },
})

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
