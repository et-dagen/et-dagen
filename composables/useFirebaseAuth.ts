import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth'

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

export const initUser = () => {
  const auth = getAuth()

  onAuthStateChanged(auth, async (user) => {
    const authStore = useAuthStore()

    if (user) {
      authStore.user = formatUser(user)
      if (authStore.pendingRoute) return navigateTo(authStore.pendingRoute)
    } else {
      authStore.user = null
    }
  })
}
