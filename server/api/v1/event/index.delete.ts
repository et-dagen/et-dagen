// DELETE /api/v1/event
// Endpoint for deleting existing events

import { authorize } from '@/domain/authorization/authorize'
import { Instant } from '@/domain/time'

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
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

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

  const env = { now: Instant.now() }
  authorize(subject, 'event', 'delete', companyOf(companyUID), env)

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

  await authorizeStoredEvent(event, subject, 'delete', eventUID, env)

  // Reference to events
  const eventsRef = db.ref('events')

  // Remove event from database
  eventsRef.child(eventUID).remove()
  trackDbDelete(event, `events/${eventUID}`)

  // Event removed successfully
  sendNoContent(event, 204)
})
