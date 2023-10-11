import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'

import type { User } from '@/models/User'

type newUser = {
  email: string
  password: string
  studyProgram?: string
  currentYear?: number
  name: string
}

// registers new user in firebase auth and db
export const registerUser = async (
  newUser: newUser,
  registrationCode?: string
) => {
  // studyprogram and current year are required when not creating a company user
  if (!registrationCode && (!newUser.studyProgram || !newUser.currentYear))
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing studyprogram or current year',
    })

  // name is handled client side with the firebase SDK and is required
  if (!newUser.name)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing name',
    })

  // check validity of registratin code
  // only applicable if creating a company user
  if (registrationCode) {
    const { isValid } = await $fetch(`/api/code/${registrationCode}`)

    // do not attempt to create user if the code is invalid
    if (!isValid)
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid registration code',
      })
  }

  const auth = getAuth()
  const authStore = useAuthStore()

  // make sure onauthStateChanged does not try to fetch
  // the user data before it is created
  authStore.registeringUser = true

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
      currentYear: newUser.currentYear,
    },
    query: {
      code: registrationCode,
    },
  })

  // sign out the new user
  await signoutUser()

  // navigate to sign in page
  const localePath = useLocalePath()
  await navigateTo({
    path: localePath('/user/signin'),
    query: {
      registered: 'true',
    },
  })

  authStore.registeringUser = false
}

// sign in firebase auth user
export const signinUser = async (email: string, password: string) => {
  const auth = getAuth()
  await signInWithEmailAndPassword(auth, email, password)

  // navigate to home page
  const localePath = useLocalePath()
  await navigateTo(localePath('/'))
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
  await $fetch('/api/user/signout', {
    method: 'POST',
  })

  // set local auth state to null
  authStore.user = null
}

// called when the application is started
// listens for changes in the firebase auth state
export const initUser = () => {
  const auth = getAuth()
  const authStore = useAuthStore()

  onAuthStateChanged(auth, async (user) => {
    // return if a user is currently being created
    if (authStore.registeringUser) return

    // user has signed out
    if (!user) return (authStore.user = null)

    // user data is already present after server side rendering
    if (authStore.isLoggedIn) return

    // get idToken and fetch user data from database
    const idToken = await user.getIdToken()

    try {
      authStore.user = await $fetch<User>('/api/user', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })
    } catch (error) {
      console.error('Could not fetch user data')
    }
  })
}

// sends password reset email to user
export const requestPasswordReset = (email: string) => {
  const auth = getAuth()
  return sendPasswordResetEmail(auth, email)
}
