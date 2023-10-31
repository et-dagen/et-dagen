// POST /api/event
// Endpoint for adding a new event to db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // Check if user is authorized
  if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  const {
    companyUID,
    capacity,
    date,
    description,
    limitedCapacity,
    location,
    title,
    eventType,
  } = await readBody(event)

  // check if important data is defined.
  if (
    !companyUID ||
    (limitedCapacity === true && !capacity) ||
    !date.start ||
    !description ||
    !location.name ||
    !title ||
    !eventType
  )
    throw createError({
      statusCode: 400,
      statusMessage: `Missing companyUID, capacity, 
starttime, description, location, title or type`,
    })

  // Check if capacity is legal
  if (limitedCapacity && (typeof capacity !== 'number' || capacity <= 0))
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

  // check if the eventtype is valid
  if (!['presentation', 'dinner', 'other'].includes(eventType))
    throw createError({
      statusCode: 400,
      statusMessage:
        "Eventtype has to be either 'presentation', 'dinner' or 'other'",
    })

  // all checks made, so push data to db
  const eventsRef = db.ref('events')

  // endtime and description don't have to be defined
  eventsRef.push({
    capacity: capacity ?? null,
    companyUID,
    date: {
      start: date.start,
      end: date.end ?? null,
    },
    description,
    limitedCapacity,
    location: {
      map: location.map ?? null,
      name: location.name,
    },
    title,
    eventType,
  })

  sendNoContent(event, 201)
})
