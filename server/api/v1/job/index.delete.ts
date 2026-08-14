// DELETE /api/v1/job
// endpoint for removing a job from db

export default defineEventHandler(async (event) => {
  const { user } = event.context

  const { jobUID } = getQuery(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'job',
    jobUID as string | undefined,
    'delete',
    'Remove job listing',
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

  // reference to jobs
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

  const { companyUID } = data[Object.keys(data)[0]]

  addEventContext(event, 'company_uid', companyUID)

  const isAdmin = hasAccess(user, ['admin'])
  const isCompanyAdmin =
    hasAccess(user, ['company']) && user.companyUID === companyUID

  addEventContext(event, 'is_admin', isAdmin)
  addEventContext(event, 'is_company_admin', isCompanyAdmin)

  // only admins and company admins can modify jobs
  if (!isAdmin && !isCompanyAdmin) {
    setErrorContext(event, {
      code: 'firebase/user-not-authorized',
      message: 'User not authorized to delete jobs',
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Error (firebase/user-not-authorized).',
    })
  }

  // remove company
  jobsRef.child(jobUID as string).remove()
  trackDbDelete(event, `jobs/${jobUID}`)

  // company successfully removed
  sendNoContent(event, 204)
})
