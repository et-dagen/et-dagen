defineRouteMeta({
  openAPI: {
    tags: ['Reference'],
    summary: 'List study programmes',
    description:
      'Public static reference data. Backs the study programme selector at sign-up.',
    security: [],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'Study programme reference data' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  // Static reference data - low importance
  setLogImportance(event, 'debug')
  setResourceContext(
    event,
    'programme',
    undefined,
    'list',
    'List study programmes',
  )

  const programmesRef = db.ref('studyProgrammes')

  const snapshot = await withDbTiming(event, 'studyProgrammes', 'read', () =>
    programmesRef.orderByKey().once('value'),
  )

  const data = snapshot.val()

  return data
})
