// GET /api/company/events
// endpoint for fetching all company events from db

export default defineEventHandler(async (event) => {
  const { user } = event.context
  const { companyUID } = getQuery(event)

  // check if user is authorized
  if (!hasAccess(user, ['admin', 'company']))
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })

  const eventsRef = db.ref('events')

  // company user must specify companyUID
  if (!companyUID && !hasAccess(user, ['admin']))
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (company/require-company-uid).',
    })

  // fetch accessible events for user
  const snapshot = hasAccess(user, ['admin'])
    ? await eventsRef.orderByKey().once('value')
    : await eventsRef
        .orderByChild('companyUID')
        .equalTo(companyUID as string)
        .once('value')

  const data = snapshot.val()

  return data
})
