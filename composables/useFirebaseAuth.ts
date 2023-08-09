import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth'

// 60sec * 60min * 24h = 1 day in seconds
const dayInSeconds = 60 * 60 * 24

export const registerUser = async (email: string, password: string) => {
  const auth = getAuth()
  const credentials = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  ).catch((error) => {
    console.error(error.code, error.message)
    return false
  })
  return credentials
}

export const signinUser = async (email: string, password: string) => {
  const auth = getAuth()
  const credentials = await signInWithEmailAndPassword(
    auth,
    email,
    password
  ).catch((error) => {
    console.error(error.code, error.message)
    return false
  })
  return credentials
}

export const signoutUser = async () => {
  const auth = getAuth()
  await auth.signOut()
}

export const initUser = () => {
  const auth = getAuth()

  onAuthStateChanged(auth, async (user) => {
    const authStore = useAuthStore()
    const token = useCookie('token', {
      maxAge: dayInSeconds * 1, // 24 hours
    })

    if (user) {
      // store idToken in cookie for use on server
      token.value = await user.getIdToken()

      // save user data in store for use on client
      authStore.user = formatUser(user)
    } else {
      authStore.user = null
      token.value = null
    }
  })
}
