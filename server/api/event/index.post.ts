// POST /api/event
// Endpoint for adding a new event to db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { companyUID, date, description, title, eventtype } = await readBody(
    event
  )

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

  // check if data is defined.
  // It is allowed to not give the endtime of the event, since that might not be clearly defined
  if (!companyUID || !date.start || !description || !title || !eventtype)
    throw createError({
      statusCode: 400,
      statusMessage:
        'Missing companyUID, starttime, description, title or type',
    })

  // check if endtime is after starttime
  if (date.start > date.end)
    throw createError({
      statusCode: 400,
      statusMessage: 'Start time has to be before end time',
    })

  // check if the eventtype is valid
  if (!['presentation', 'dinner', 'other'].includes(eventtype))
    throw createError({
      statusCode: 400,
      statusMessage:
        "Eventtype has to be either 'presentation', 'dinner' or 'other'",
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
    description,
    title,
    eventtype,
  })

  sendNoContent(event, 201)
})
