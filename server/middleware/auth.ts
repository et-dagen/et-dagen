export default defineEventHandler(async (event) => {
  // get idToken from cookie
  const idToken = getCookie(event, 'token')
  if (!idToken) return

  try {
    // check validity of idToken
    const decodedToken = await auth.verifyIdToken(idToken)
    event.context.auth = decodedToken
  } catch (error) {
    // idToken invalid, the user is not authenticated
  }
})
