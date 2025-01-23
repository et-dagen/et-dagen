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
    registration,
  } = await readBody(event)

  // check if data is defined.
  if (
    (!companyUID && companyUID !== 'etdagene') ||
    (typeof capacity === 'number' && capacity <= 0) ||
    (capacity !== null && typeof capacity !== 'number') ||
    !date.start ||
    !date.end ||
    !description ||
    !location.name ||
    (!location.map && location.map !== null) ||
    !title ||
    (capacity && (!registration.start || !registration.end))
  )
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (general/missing-data).',
    })

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

  // Check if capacity is legal
  if (typeof capacity !== 'number' && capacity !== null)
    throw createError({
      statusCode: 400,
      statusMessage: `Capacity has to be a number or null '${capacity}'`,
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
  if (registration.start > date.start || registration.end > date.start)
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

  // all checks made, so push data to db
  const eventsRef = db.ref('events')

  // endtime and description don't have to be defined
  eventsRef.push({
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
    registration,
    queue: {}, // Initialize an empty queue
  })

  sendNoContent(event, 201)
})
