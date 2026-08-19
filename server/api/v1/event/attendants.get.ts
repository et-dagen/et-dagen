// GET /api/v1/event/attendants
// Admin-only: get a list of attendant emails for a given event

defineRouteMeta({
  openAPI: {
    tags: ['Event'],
    summary: 'List attendant emails',
    description:
      'Admin only. Resolves each attendant UID to its Firebase email; unresolvable UIDs are ' +
      'dropped silently.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'eventUID',
        in: 'query',
        required: true,
        schema: { type: 'string' },
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: {
    //     description: 'Event title and attendant emails',
    //     content: {
    //       'application/json': {
    //         schema: {
    //           type: 'object',
    //           properties: {
    //             eventName: { type: 'string', nullable: true },
    //             emails: { type: 'array', items: { type: 'string' } },
    //           },
    //         },
    //       },
    //     },
    //   },
    //   400: { description: 'Error (event/attendants/missing-event-uid).' },
    //   401: { description: 'Error (event/attendants/not-admin).' },
    //   404: { description: 'Error (event/not-found).' },
    // },
  },
})

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
