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
