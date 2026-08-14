// GET /api/v1/job
// endpoint for fetching jobs from db

export default defineEventHandler(async (event) => {
  const { jobUID } = getQuery(event)

  // Set resource context for wide event logging
  setResourceContext(
    event,
    'job',
    jobUID as string | undefined,
    jobUID ? 'get' : 'list',
    jobUID ? 'Fetch single job' : 'List all jobs',
  )

  const jobsRef = db.ref('jobs')

  // return all jobs if no job is specified
  if (!jobUID) {
    const snapshot = await withDbTiming(event, 'jobs', 'read', () =>
      jobsRef.orderByKey().once('value'),
    )
    const data = snapshot.val()

    // Add result metadata to wide event
    addEventContext(event, 'result_count', data ? Object.keys(data).length : 0)

    return data
  }

  // get specified event
  const snapshot = await withDbTiming(event, `jobs/${jobUID}`, 'read', () =>
    jobsRef
      .orderByKey()
      .equalTo(jobUID as string)
      .once('value'),
  )

  const data = snapshot.val()

  // Track whether job was found
  addEventContext(event, 'job_found', !!data)

  return data
})
