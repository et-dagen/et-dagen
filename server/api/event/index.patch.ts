// PATCH /api/events
// Endpoint for modifying existing events

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { companyUID } = await readBody(event)

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user.companyUID !== companyUID)
      throw createError({
        statusCode: 401,
        statusMessage: 'Company users cannot delete events for other companies',
      })
  } else if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authenticated',
    })

  // Check if input is valid

  // Get database reference
  const eventsRef = db.ref('events')
  console.log(eventsRef)
})
