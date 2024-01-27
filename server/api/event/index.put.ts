// PUT /api/events
// Endpoint for overwriting existing events

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { companyUID, eventUID, capacity, date, description, location, title } =
    await readBody(event)

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user.companyUID !== companyUID)
      throw createError({
        statusCode: 401,
        statusMessage: 'Company users cannot update events for other companies',
      })
  } else if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
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
    title === null
  )
    throw createError({
      statusCode: 400,
      statusMessage: 'Not all data is defined',
    })

  // Check if capacity is legal
  if (typeof capacity !== 'number' && capacity !== null)
    throw createError({
      statusCode: 400,
      statusMessage: 'Capacity has to be a number or null',
    })

  if (typeof capacity !== 'number' && !capacity === null && capacity <= 0)
    throw createError({
      statusCode: 400,
      statusMessage: 'Capacity has to be a number and larger than 0',
    })

  // check if endtime is after starttime
  if (date.start > date.end)
    throw createError({
      statusCode: 400,
      statusMessage: 'Start time has to be before end time',
    })

  // TODO: Add support for different event types
  // check if the eventtype is valid
  // if (!['presentation', 'dinner', 'other'].includes(eventType))
  //   throw createError({
  //     statusCode: 400,
  //     statusMessage:
  //       "Eventtype has to be either 'presentation', 'dinner' or 'other'",
  //   })

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
    description,
    location: {
      map: location.map,
      name: location.name,
    },
    title,
    // eventType,
  }

  // Update database information
  eventRef.update(updates)

  sendNoContent(event, 204)
})
