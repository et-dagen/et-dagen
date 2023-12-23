// DELETE /api/job
// endpoint for removing a job from db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { jobUID } = getQuery(event)

  if (!jobUID)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing jobUID',
    })

  // reference to companies
  const jobsRef = db.ref('jobs')

  // check if the company exists
  const snapshot = await jobsRef
    .orderByKey()
    .equalTo(jobUID as string)
    .once('value')

  const data = snapshot.val()

  // the company does not exist in db
  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'Job not found',
    })

  const { companyUID } = data[Object.keys(data)[0]]

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user?.companyUID !== companyUID)
      throw createError({
        statusCode: 401,
        statusMessage:
          'Company users can only remove jobs belonging to their own company',
      })
  } else if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // remove company
  jobsRef.child(jobUID as string).remove()

  // company successfully removed
  sendNoContent(event, 204)
})
