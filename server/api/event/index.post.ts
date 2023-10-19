// POST /api/event
// Endpoint for adding a new event to db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { companyUID, date, description, title, eventtype } = await readBody(
    event
  )

  // check if data is defined
  if (!companyUID || !date.start || !description || !title)
    throw createError({
      statusCode: 400,
      statusMessage:
        'missing companyUID, starttime, description, title or type',
    })

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user.companyUID !== companyUID)
      throw createError({
        statusCode: 401,
        statusMessage: 'Company users cannot create events for other companies',
      })
  } else if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // check if endtime is after starttime
  if (date.start > date.end)
    throw createError({
      statusCode: 400,
      statusMessage: 'start time has to be before end time',
    })

  // check if the eventtype is valid
  if (!['presentation', 'dinner', null].includes(eventtype))
    throw createError({
      statusCode: 400,
      statusMessage: 'eventtype has to be either presentation, dinner or null',
    })

  // all checks made, so push data to db
  const eventsRef = db.ref('events')

  // endtime and description don't have to be defined
  eventsRef.push({
    companyUID,
    date: {
      start: date.start,
      end: date.end ?? null,
    },
    description: description ?? null,
    title,
    eventtype,
  })

  sendNoContent(event, 201)
})
