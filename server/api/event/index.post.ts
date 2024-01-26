// POST /api/event
// Endpoint for adding a new event to db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const {
    companyUID,
    capacity,
    date,
    description,
    location,
    title,
    signUpStart,
    optOutDeadline,
  } = await readBody(event)

  // check if data is defined.
  if (
    !companyUID ||
    (typeof capacity === 'number' && capacity <= 0) ||
    (capacity !== null && typeof capacity !== 'number') ||
    !date.start ||
    !date.end ||
    !description ||
    !location.name ||
    (!location.map && location.map !== null) ||
    !title ||
    (capacity && (!signUpStart || !optOutDeadline))
  )
    throw createError({
      statusCode: 400,
      statusMessage: 'Not all data is defined',
    })

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user.companyUID !== companyUID)
      throw createError({
        statusCode: 401,
        statusMessage: 'Company users cannot post events for other companies',
      })
  } else if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // Check if capacity is legal
  if (typeof capacity !== 'number' && capacity !== null)
    throw createError({
      statusCode: 400,
      statusMessage: `Capacity has to be a number or null '${capacity}'`,
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

  // check if sign up start and opt out deadline is before event start
  if (signUpStart > date.start || optOutDeadline > date.start)
    throw createError({
      statusCode: 400,
      statusMessage:
        'Sign up start and opt out deadline must be before event start',
    })

  // TODO: Add support for different event types
  // check if the eventtype is valid
  // if (!['presentation', 'dinner', 'other'].includes(eventType))
  //   throw createError({
  //     statusCode: 400,
  //     statusMessage:
  //       "Eventtype has to be either 'presentation', 'dinner' or 'other'",
  //   })

  // all checks made, so push data to db
  const eventsRef = db.ref('events')

  // endtime and description don't have to be defined
  eventsRef.push({
    // limitedCapacity,
    capacity,
    companyUID,
    date: {
      start: date.start,
      end: date.end,
    },
    description,
    location: {
      map: location.map,
      name: location.name,
    },
    title,
    // eventType,
  })

  sendNoContent(event, 201)
})
