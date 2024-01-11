export default defineEventHandler(async () => {
  const programmesRef = db.ref('studyProgrammes')

  // get specified company
  const snapshot = await programmesRef.orderByKey().once('value')

  const data = snapshot.val()

  return data
})
