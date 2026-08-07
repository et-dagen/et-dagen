// POST /api/v1/event
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

  // Set resource context for wide event logging
  setResourceContext(event, 'event', undefined, 'create', 'Create new event')
  setLogImportance(event, 'warn')

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
      message: 'User not authorized to create event',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  // Check if capacity is legal
  if (typeof capacity !== 'number' && capacity !== null) {
    setErrorContext(event, {
      code: 'event/wrong-format-capacity',
      message: 'Capacity has to be a number or null',
    })
    throw createError({
      statusCode: 400,
      statusMessage: `Capacity has to be a number or null '${capacity}'`,
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
      statusMessage: 'Start time has to be before end time',
    })
  }

  // registration window must be before event start
  if (registration.start > date.start || registration.end > date.start) {
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
    registration,
    // eventType,
  })
  trackDbWrite(event, 'events')

  addEventContext(event, 'company_uid', companyUID)
  addEventContext(event, 'has_capacity', capacity !== null)

  sendNoContent(event, 201)
})
