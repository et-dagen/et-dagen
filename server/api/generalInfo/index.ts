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
