// PUT /api/job
// endpoint for editing jobs in the database

import { isValidDate } from '../../../composables/useDate'

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { jobUID, ...newData } = await readBody(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'job',
    jobUID as string | undefined,
    'update',
    'Edit existing job listing',
  )
  setLogImportance(event, 'warn')

  if (!jobUID) {
    setErrorContext(event, {
      code: 'job/missing-job-uid',
      message: 'Job UID is missing',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/missing-job-uid).',
    })
  }

  // check if any of the newData values are null
  const valuesArr = Object.values(newData)
  if (valuesArr.includes(null)) {
    setErrorContext(event, {
      code: 'job/cannot-remove-single-fields',
      message: 'Cannot remove single fields from a job',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (job/cannot-remove-single-fields).',
    })
  }

  const jobsRef = db.ref('jobs')

  // check if the job exists
  const snapshot = await withDbTiming(event, `jobs/${jobUID}`, 'read', () =>
    jobsRef
      .orderByKey()
      .equalTo(jobUID as string)
      .once('value'),
  )

  const data = snapshot.val()

  // the job does not exist in db
  if (!data) {
    setErrorContext(event, {
      code: 'job/not-found',
      message: 'Job not found',
    })
    throw createError({
      statusCode: 404,
      statusMessage: 'Error (job/not-found).',
    })
  }

  const dbData = data[Object.keys(data)[0]]
  const { companyUID } = dbData

  addEventContext(event, 'company_uid', companyUID)

  const newKeys = Object.keys(newData)
  const oldKeys = Object.keys(dbData)

  // make sure all keys that are to be changed already exsists in the db
  if (!newKeys.every((key) => oldKeys.includes(key))) {
    setErrorContext(event, {
      code: 'job/cannot-remove-single-fields',
      message: 'Cannot add new fields that do not already exist',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/cannot-remove-single-fields).',
    })
  }

  if (newData.deadline && !isValidDate(newData.deadline)) {
    setErrorContext(event, {
      code: 'job/invalid-date',
      message: 'Invalid deadline date format',
    })
    throw createError({
      statusCode: 400,
      statusMessage: 'Error (job/invalid-date).',
    })
  }

  const isAdmin = hasAccess(user, ['admin'])
  const isCompanyAdmin =
    hasAccess(user, ['company']) && user.companyUID === companyUID

  addEventContext(event, 'is_admin', isAdmin)
  addEventContext(event, 'is_company_admin', isCompanyAdmin)

  // only admins and company admins can modify jobs
  if (!isAdmin && !isCompanyAdmin) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to modify jobs',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  jobsRef.child(jobUID).update(newData)
  trackDbWrite(event, `jobs/${jobUID}`)

  sendNoContent(event, 204)
})
