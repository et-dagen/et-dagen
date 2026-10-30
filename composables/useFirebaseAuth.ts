import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'

import type { User } from '@/models/User'

type newUser = {
  email: string
  password: string
  studyProgram?: string
  currentYear?: number
  name: string
  dietaryRestrictions: string[] | null
}

// registers new user in firebase auth and db
export const registerUser = async (newUser: newUser) => {
  // studyprogram and current year are required
  if (!newUser.studyProgram || !newUser.currentYear)
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

  const authStore = useAuthStore()
  const localePath = useLocalePath()

  // make sure onauthStateChanged does not try to fetch
  // the user data before it is created
  authStore.registeringUser = true
  try {
    await createAccount(newUser)
  } finally {
    authStore.registeringUser = false
  }
  await navigateTo(localePath('/'))
}

async function createAccount(newUser: newUser) {
  const auth = getAuth()

  // register user in firebase auth
  const { user } = await createUserWithEmailAndPassword(
    auth,
    newUser.email,
    newUser.password,
  )

  try {
    await saveProfile(user, newUser)
  } catch (cause) {
    // an account without a profile would block the next try with "email taken"
    await user.delete().catch(() => {})
    throw cause
  }
}

async function saveProfile(user: FirebaseUser, newUser: newUser) {
  const authStore = useAuthStore()

  // set displayname in firebase auth
  await updateProfile(user, { displayName: newUser.name })

  // a fresh token carries the name; the session started from it keeps its claims for two weeks
  const idToken = await user.getIdToken(true)
  await $fetch('/api/v1/user', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: {
      studyProgram: newUser.studyProgram,
      currentYear: newUser.currentYear,
      dietaryRestrictions: newUser.dietaryRestrictions,
    },
  })

  // the new account stays signed in, as after signing in
  await startSession(idToken)
  authStore.user = await $fetch<User>('/api/v1/user', {
    headers: { Authorization: `Bearer ${idToken}` },
  })
}

// starts the server session from a sign-in that just happened (#582)
const startSession = async (idToken: string) =>
  await $fetch('/api/v1/session', { method: 'POST', body: { idToken } })

// signs in and starts the server session, staying on the page
export const signInHere = async (email: string, password: string) => {
  const { user } = await signInWithEmailAndPassword(getAuth(), email, password)
  await startSession(await user.getIdToken())
}

// signs out and ends the server session, staying on the page
export const signOutHere = async () => {
  await $fetch('/api/v1/session', { method: 'DELETE' }).catch(() => {})
  await getAuth().signOut()
  useAuthStore().user = null
}

// sign in firebase auth user
export const signinUser = async (email: string, password: string) => {
  await signInHere(email, password)

  // navigate to home page
  const localePath = useLocalePath()
  await navigateTo(localePath('/'))
}

// signs out firebase user and removes token cookie
export const signoutUser = async () => {
  const auth = getAuth()
  const authStore = useAuthStore()
  const localePath = useLocalePath()

  // end the session on the server first, while its cookie still says who is signing out
  await $fetch('/api/v1/session', { method: 'DELETE' }).catch(() => {})

  // end the session on the server first, while its cookie still says who is signing out
  await $fetch('/api/v1/session', { method: 'DELETE' }).catch(() => {})

  // sign out user and navigate to home page
  await navigateTo(localePath('/'))
  await auth.signOut()

  // set local auth state to null
  authStore.user = null
}

// deletes the signed-in user and everything stored about them, then signs out locally
export const deleteSignedInUser = async () => {
  const authStore = useAuthStore()
  const localePath = useLocalePath()

  // the server also clears the token cookie
  await $fetch('/api/v1/user', { method: 'DELETE', body: {} })

  // leave the protected page before the local user disappears
  await navigateTo(localePath('/'))
  await getAuth().signOut()
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

    // the browser remembers a sign-in the server has no session for (it ran out or was
    // revoked); a session starts only right after signing in, so sign in again
    const idToken = await user.getIdToken()
    try {
      await startSession(idToken)
    } catch {
      await auth.signOut()
      authStore.user = null
      return
    }

    try {
      authStore.user = await $fetch<User>('/api/v1/user', {
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
