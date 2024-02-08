// PUT /api/job
// endpoint for editing jobs in the database

import { isValidDate } from '../../../composables/useDate'

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { jobUID, ...newData } = await readBody(event)

  if (!jobUID)
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/missing-job-uid).',
    })

  // check if any of the newData values are null
  const valuesArr = Object.values(newData)
  if (valuesArr.includes(null))
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (job/cannot-remove-single-fields).',
    })

  const jobsRef = db.ref('jobs')

  // check if the job exists
  const snapshot = await jobsRef
    .orderByKey()
    .equalTo(jobUID as string)
    .once('value')

  const data = snapshot.val()

  // the job does not exist in db
  if (!data)
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (job/not-found).',
    })

  const dbData = data[Object.keys(data)[0]]
  const { companyUID } = dbData

  const newKeys = Object.keys(newData)
  const oldKeys = Object.keys(dbData)

  // make sure all keys that are to be changed already exsists in the db
  if (!newKeys.every((key) => oldKeys.includes(key)))
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/cannot-remove-single-fields).',
    })

  if (newData.deadline && !isValidDate(newData.deadline))
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

  jobsRef.child(jobUID).update(newData)

  sendNoContent(event, 204)
})
