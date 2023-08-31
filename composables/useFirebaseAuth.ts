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

export const signoutUser = async () => {
  const auth = getAuth()
  const app = useAppStore()
  const localePath = useLocalePath()

  app.drawer = false

  // sign out user and navigate to home page
  await navigateTo(localePath('/'))
  await auth.signOut()

  // remove token cookie
  try {
    await $fetch('/api/user/signout', {
      method: 'POST',
    })
  } catch (error) {
    console.log('Could not sign out user')
  }
  authStore.user = null
}

export const initUser = () => {
  const auth = getAuth()

  onAuthStateChanged(auth, async (user) => {
    const authStore = useAuthStore()

    if (user) {
      // store idToken in cookie for use on server
      const idToken = await user.getIdToken()

      // fetch user data if user is not already signed in after server render
      if (!authStore.isLoggedIn)
        try {
          authStore.user = await $fetch('/api/user', {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          })
        } catch (error) {
          console.error('Could not fetch user data')
        }
    } else {
      authStore.user = null
    }
  })
}
