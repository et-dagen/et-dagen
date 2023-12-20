export default defineEventHandler(async (event) => {
  const { decodedToken } = event.context

  if (!decodedToken) return

  // reference to users
  const usersRef = db.ref('users')

  // get user data
  const snapshot = await usersRef
    .orderByKey()
    .equalTo(decodedToken.uid)
    .once('value')

  // get user object
  const data = snapshot.val()

  // user not in database
  if (!data) return

  event.context.user = {
    ...formatFirebaseUser(decodedToken),
    ...data[decodedToken.uid],
  }
})
