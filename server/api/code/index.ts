// GET /api/code
// endpoint for retrieving codes in the db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  // only admins can create new registration codes
  if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })

  // reference to companies
  const registrationCodesRef = db.ref('registrationCodes')

  const snapshot = await registrationCodesRef.orderByKey().once('value')
  const data = snapshot.val()

  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (code/not-found).',
    })

  return data
})
