// 60sec * 60min * 24h = 1 day in seconds
const dayInSeconds = 60 * 60 * 24

export default defineEventHandler(async (event) => {
  // get idToken from Authorization header or cookie
  let idToken = getHeader(event, 'Authorization') ?? getCookie(event, '_token')

  // no idToken
  if (!idToken) return

  // set new token cookie on response
  if (idToken.includes('Bearer')) {
    idToken = idToken.split('Bearer ')[1]
    setCookie(event, '_token', idToken, {
      httpOnly: true,
      maxAge: dayInSeconds * 1,
    })
  }

  try {
    // check validity of idToken
    const decodedToken = await auth.verifyIdToken(idToken)
    // place decoded token on h3 event context
    event.context.decodedToken = decodedToken
  } catch (error) {
    // idToken invalid, the user is not authenticated
  }
})
