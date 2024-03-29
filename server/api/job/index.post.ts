//  GET /api/job
// endpoint for creating a new job in the database

import { isValidDate } from '../../../composables/useDate'

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const {
    companyUID,
    title,
    description,
    deadline,
    jobType,
    location,
    applicationLink,
  } = await readBody(event)

  console.log(!!applicationLink)

  // make sure all necessary data is included
  if (
    !companyUID ||
    !title ||
    !description ||
    !deadline ||
    !jobType ||
    !location ||
    typeof applicationLink !== 'string'
  )
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (general/missing-data).',
    })

  if (!isValidDate(deadline))
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/invalid-date).',
    })

  const isAdmin = hasAccess(user, ['admin'])
  const isCompanyAdmin =
    hasAccess(user, ['company']) && user.companyUID === companyUID

  // only admins and company admins can modify jobs
  if (!isAdmin && !isCompanyAdmin)
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
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
      statusMessage: 'Error (company/not-found).',
    })

  const jobsRef = db.ref('jobs')

  jobsRef.push({
    companyUID,
    title,
    description,
    deadline,
    jobType,
    location,
    applicationLink,
  })

  sendNoContent(event, 201)
})
