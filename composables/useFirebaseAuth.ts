import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'

type newUser = {
  email: string
  password: string
  studyProgram: string
  name: string
}

// registers new user in firebase auth and db
export const registerUser = async (newUser: newUser) => {
  const auth = getAuth()
  const appStore = useAppStore()

  // make sure onauthStateChanged does not try to fetch
  // the user data before it is created
  appStore.registeringUser = true

  // register user in firebase auth
  const { user } = await createUserWithEmailAndPassword(
    auth,
    newUser.email,
    newUser.password
  )

  // set displayname in firebase auth
  await updateProfile(user, { displayName: newUser.name })

  // get idToken and register user in db
  const idToken = await user.getIdToken()
  await $fetch('/api/user', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: {
      studyProgram: newUser.studyProgram,
    },
  })

  // sign out the new user
  await signoutUser()

  // navigate to sign in page
  const localePath = useLocalePath()
  await navigateTo(localePath('/user/signin'))

  appStore.registeringUser = false
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

// signs out firebase user and removes token cookie
export const signoutUser = async () => {
  const auth = getAuth()
  const app = useAppStore()
  const authStore = useAuthStore()
  const localePath = useLocalePath()

  // close app drawer
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

  // set local auth state to null
  authStore.user = null
}

// called when the application is started
// listens for changes in the firebase auth state
export const initUser = () => {
  const auth = getAuth()
  const appStore = useAppStore()

  onAuthStateChanged(auth, async (user) => {
    // return if a user is currently being created
    if (appStore.registeringUser) return

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
