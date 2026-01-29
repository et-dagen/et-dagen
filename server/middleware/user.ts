export default defineEventHandler(async (event) => {
  const { decodedToken, wideEvent } = event.context

  if (!decodedToken) return

  // reference to users
  const usersRef = db.ref('users')

  // Track database read for wide event
  const dbReadStart = Date.now()

  // get user data
  const snapshot = await usersRef
    .orderByKey()
    .equalTo(decodedToken.uid)
    .once('value')

  // Track database operation in wide event
  if (wideEvent) {
    wideEvent.db = wideEvent.db ?? {
      queries: 0,
      reads: 0,
      writes: 0,
      operations: [],
    }
    wideEvent.db.queries++
    wideEvent.db.reads++
    wideEvent.db.operations?.push({
      type: 'read',
      ref: `users/${decodedToken.uid}`,
      duration_ms: Date.now() - dbReadStart,
    })
  }

  // get user object
  const data = snapshot.val()

  // user not in database
  if (!data) return

  const userData = data[decodedToken.uid]

  event.context.user = {
    ...formatFirebaseUser(decodedToken),
    ...userData,
  }

  // Enrich wide event with user context
  if (wideEvent) {
    wideEvent.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name ?? userData?.name,
      access_level: userData?.accessLevel,
      study_program: userData?.studyProgram,
      current_year: userData?.currentYear,
    }
  }
})
