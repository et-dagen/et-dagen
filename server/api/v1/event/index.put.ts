// PUT /api/v1/event
// Endpoint for overwriting existing events

import { fail } from '@/domain/errors'
import { EventUid } from '@/domain/event/event'
import { Instant } from '@/domain/time'
import { rtdbEventRepository } from '@/server/adapters/rtdb/eventRepository'
import { cleanRichText, safeLink } from '@/server/security/richText'
import { authorize } from '@/domain/authorization/authorize'

defineRouteMeta({
  openAPI: {
    tags: ['Event'],
    summary: 'Overwrite existing event',
    description:
      'Admin, or a coordinator of the owning company. Replaces the whole event record, so every ' +
      'field must ' +
      'be supplied.',
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
    //         required: ['eventUID', 'companyUID'],
    //         properties: {
    //           eventUID: { type: 'string' },
    //           companyUID: { type: 'string' },
    //         },
    //         additionalProperties: true,
    //       },
    //     },
    //   },
    // },
    // responses: {
    //   204: { description: 'Updated' },
    //   400: { description: 'Error (general/missing-data). and capacity/date validation errors' },
    //   401: { description: 'auth/signed-out' },
    //   403: { description: 'auth/forbidden' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  const { subject } = event.context

  const {
    companyUID,
    eventUID,
    capacity,
    date,
    description,
    location,
    title,
    registration,
  } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'event',
    eventUID,
    'update',
    'Overwrite existing event',
  )
  setLogImportance(event, 'warn')

  const env = { now: Instant.now() }
  authorize(subject, 'event', 'update', companyOf(companyUID), env)

  // check if data is defined.
  if (
    companyUID === null ||
    eventUID === null ||
    (typeof capacity === 'number' && capacity <= 0) ||
    (capacity !== null && typeof capacity !== 'number') ||
    date.start === null ||
    date.end === null ||
    description === null ||
    location.name === null ||
    (!location.map && location.map !== null) ||
    title === null ||
    (capacity !== null && (!registration.start || !registration.end))
  ) {
    setErrorContext(event, {
      code: 'general/missing-data',
      message: 'Required event data is missing',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (general/missing-data).',
    })
  }

  if (location.map && !safeLink(location.map)) {
    throw fail('event/invalid-map-link')
  }

  // Check if capacity is legal
  if (typeof capacity !== 'number' && capacity !== null) {
    setErrorContext(event, {
      code: 'event/incorrect-capacity',
      message: 'Capacity has to be a number or null',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/incorrect-capacity).',
    })
  }

  if (typeof capacity !== 'number' && !(capacity === null) && capacity <= 0) {
    setErrorContext(event, {
      code: 'event/wrong-format-capacity',
      message: 'Capacity has an invalid format',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/wrong-format-capacity).',
    })
  }

  // check if endtime is after starttime
  if (date.start > date.end) {
    setErrorContext(event, {
      code: 'event/start-after-end',
      message: 'Start time has to be before end time',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/start-after-end).',
    })
  }

  // registration window must be before event start
  if (
    capacity &&
    (registration.start > date.start || registration.end > date.start)
  ) {
    setErrorContext(event, {
      code: 'event/registration-after-event',
      message: 'Registration window is after event start',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/registration-after-event).',
    })
  }

  // registration window must open before it closes
  if (capacity && registration.start > registration.end) {
    setErrorContext(event, {
      code: 'event/registration-start-after-end',
      message: 'Registration opens after it closes',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/registration-start-after-end).',
    })
  }

  // TODO: Add support for different event types
  // check if the eventtype is valid
  // if (!['presentation', 'dinner', 'other'].includes(eventType))
  //   throw createError({
  //     statusCode: 400,
  //     statusMessage:
  //       "Eventtype has to be either 'presentation', 'dinner' or 'other'",
  //   })

  await authorizeStoredEvent(event, subject, 'update', eventUID, env)

  // Get database reference
  const eventRef = db.ref(`events/${eventUID}`)

  // Add defined inputs to updates-object
  const updates = {
    // limitedCapacity,
    capacity,
    companyUID,
    date: {
      end: date.end,
      start: date.start,
    },
    description: cleanRichText(description),
    location: {
      map: location.map ? safeLink(location.map) : location.map,
      name: location.name,
    },
    title,
    registration,
    // eventType,
  }

  // Update database information
  await eventRef.update(updates)
  trackDbWrite(event, `events/${eventUID}`)

  // a raised capacity gives the new spots to the queue
  const promotion = await rtdbEventRepository(db).promoteWaiting(
    EventUid.parse(eventUID),
    Instant.now(),
  )
  if ('promoted' in promotion) {
    addEventContext(event, 'queue_promoted', promotion.promoted.length)
  }

  addEventContext(event, 'company_uid', companyUID)
  addEventContext(event, 'has_capacity', capacity !== null)

  sendNoContent(event, 204)
})
