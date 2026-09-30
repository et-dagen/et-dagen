defineRouteMeta({
  openAPI: {
    tags: ['Reference'],
    summary: 'Fetch general site info',
    description: 'Public static reference data used across the site.',
    security: [],
    // TODO(api-docs): fill in the request/response schemas below.
    // Shapes are sketched from current handler behaviour - verify each
    // against the handler before uncommenting.
    // responses: {
    //   200: { description: 'General site information object' },
    // },
  },
})

export default defineEventHandler(async (event) => {
  // Static reference data - low importance
  setLogImportance(event, 'debug')
  setResourceContext(
    event,
    'generalInfo',
    undefined,
    'get',
    'Fetch general site info',
  )

  const infoRef = db.ref('generalInfo')

  const snapshot = await withDbTiming(event, 'generalInfo', 'read', () =>
    infoRef.orderByKey().once('value'),
  )

  const data = snapshot.val()

  return data
})
