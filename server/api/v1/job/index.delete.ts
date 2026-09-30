// DELETE /api/v1/job
// endpoint for removing a job from db

defineRouteMeta({
  openAPI: {
    tags: ['Job'],
    summary: 'Remove job listing',
    description:
      'Admin, or the owning company user. Ownership is resolved from the stored record, so ' +
      'authorization happens after the lookup. This is the only DELETE that takes a query ' +
      'parameter rather than a body.',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [
      {
        name: 'jobUID',
        in: 'query',
        required: true,
        schema: { type: 'string' },
      },
    ],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   204: { description: 'Removed' },
    //   400: { description: 'Error (job/missing-job-uid).' },
    //   401: { description: 'Error (firebase/user-not-authorized).' },
    //   404: { description: 'Error (job/not-found).' },
    // },
  },
})

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
