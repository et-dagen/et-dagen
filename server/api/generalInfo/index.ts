export default defineEventHandler(async () => {
  const infoRef = db.ref('generalInfo')

  const snapshot = await infoRef.orderByKey().once('value')

  const data = snapshot.val()

  return data
})
