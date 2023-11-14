// GET /api/event
// endpoint for fetching events from db

export default defineEventHandler(async (event) => {
  const { eventUID } = getQuery(event)

  const eventsRef = db.ref('events')

  // return all events if no event is specified
  if (!eventUID) {
    const snapshot = await eventsRef.orderByKey().once('value')
    const data = snapshot.val()

    return data
  }

  // get specified event
  const snapshot = await eventsRef
    .orderByKey()
    .equalTo(eventUID as string)
    .once('value')

  const data = snapshot.val()

  return data
})
