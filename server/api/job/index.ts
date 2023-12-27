// GET /api/job
// endpoint for fetching jobs from db

export default defineEventHandler(async (event) => {
  const { jobUID } = getQuery(event)

  const jobsRef = db.ref('jobs')

  // return all jobs if no job is specified
  if (!jobUID) {
    const snapshot = await jobsRef.orderByKey().once('value')
    const data = snapshot.val()

    return data
  }

  // get specified event
  const snapshot = await jobsRef
    .orderByKey()
    .equalTo(jobUID as string)
    .once('value')

  const data = snapshot.val()

  return data
})
