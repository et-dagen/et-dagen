// PUT /api/events
// Endpoint for overwriting existing events

export default defineEventHandler(async (event) => {
  const { user } = event.context

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

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user.companyUID !== companyUID)
      throw createError({
        statusCode: 401,
        statusMessage: 'Error (event/not-owner).',
      })
  } else if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })

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
  )
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (general/missing-data).',
    })

  // Check if capacity is legal
  if (typeof capacity !== 'number' && capacity !== null)
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/incorrect-capacity).',
    })

  if (typeof capacity !== 'number' && !(capacity === null) && capacity <= 0)
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/wrong-format-capacity).',
    })

  // check if endtime is after starttime
  if (date.start > date.end)
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/start-after-end).',
    })

  // registration window must be before event start
  if (
    capacity &&
    (registration.start > date.start || registration.end > date.start)
  )
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/registration-after-event).',
    })

  // registration window must open before it closes
  if (capacity && registration.start > registration.end)
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (event/registration-start-after-end).',
    })

  // Get database reference
  const eventRef = db.ref(`events/${eventUID}`)

  // Add defined inputs to updates-object
  const updates = {
    capacity,
    companyUID,
    date: {
      end: date.end,
      start: date.start,
    },
    description,
    location: {
      map: location.map,
      name: location.name,
    },
    title,
    registration,
  }

  // Update database information
  eventRef.update(updates)

  sendNoContent(event, 204)
})
