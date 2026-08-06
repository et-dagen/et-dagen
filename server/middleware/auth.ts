// 60sec * 60min * 24h = 1 day in seconds
const dayInSeconds = 60 * 60 * 24

export default defineEventHandler(async (event) => {
  const { wideEvent } = event.context

  // get idToken from Authorization header or cookie
  let idToken = getHeader(event, 'Authorization') ?? getCookie(event, '_token')

  // no idToken - enrich wide event with unauthenticated context
  if (!idToken) {
    if (wideEvent) {
      wideEvent.auth = {
        authenticated: false,
      }
    }
    return
  }

  // Determine auth method for wide event
  const authMethod = idToken.includes('Bearer') ? 'bearer' : 'cookie'

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

    // Enrich wide event with auth context
    if (wideEvent) {
      wideEvent.auth = {
        authenticated: true,
        token_valid: true,
        auth_method: authMethod,
      }
    }
  } catch (error) {
    // idToken invalid, the user is not authenticated
    if (wideEvent) {
      wideEvent.auth = {
        authenticated: false,
        token_valid: false,
        auth_method: authMethod,
      }
    }
  }
})
