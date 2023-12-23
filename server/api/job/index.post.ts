//  GET /api/job
// endpoint for creating a new job in the database

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { companyUID, title, description, deadline } = await readBody(event)

  console.log(companyUID, title, description, deadline)

  // make sure all necessary data is included
  if (!companyUID || !title || !description || !deadline)
    throw createError({
      statusCode: 400,
      statusMessage: 'Not all data is defined',
    })

  // Check if user is authorized
  if (hasAccess(user, ['company'])) {
    if (user?.companyUID !== companyUID)
      throw createError({
        statusCode: 401,
        statusMessage: 'Company users cannot post jobs for other companies',
      })
  } else if (!hasAccess(user, ['admin']))
    throw createError({
      statusCode: 401,
      statusMessage: 'User not authorized',
    })

  // reference to companies
  const companiesRef = db.ref('companies')

  // check if the company exists
  const snapshot = await companiesRef
    .orderByKey()
    .equalTo(companyUID)
    .once('value')

  const data = snapshot.val()

  // the company does not exist in db
  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'Company not found',
    })

  const jobsRef = db.ref('jobs')

  jobsRef.push({
    companyUID,
    title,
    description,
    deadline,
  })

  sendNoContent(event, 201)
})
