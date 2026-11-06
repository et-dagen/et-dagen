import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import type { User } from '@/models/User'
import { useAuthStore } from '@/stores/authStore'

/** Starts the server session from a sign-in that just happened (#582) */
export const startSession = async (idToken: string) =>
  await $fetch('/api/v1/session', { method: 'POST', body: { idToken } })

/** The signed-in user's profile, or null when it cannot be read */
const loadUser = (idToken: string) =>
  $fetch<User>('/api/v1/user', {
    headers: { Authorization: `Bearer ${idToken}` },
  }).catch(() => {
    console.error('Could not fetch user data')
    return null
  })

/** Ends the server session; its cookie says who is signing out, so this goes first */
const endSession = () =>
  $fetch('/api/v1/session', { method: 'DELETE' }).catch(() => {})

/** Signs in, starts the server session and loads the user, staying on the page */
export const signInHere = async (email: string, password: string) => {
  const authStore = useAuthStore()
  // the auth state listener waits, or it would start a second session for the same sign-in
  authStore.signingIn = true
  try {
    const { user } = await signInWithEmailAndPassword(
      getAuth(),
      email,
      password,
    )
    const idToken = await user.getIdToken()
    await startSession(idToken)
    authStore.user = await loadUser(idToken)
  } finally {
    authStore.signingIn = false
  }
}

/** Signs out and ends the server session, staying on the page */
export const signOutHere = async () => {
  await endSession()
  await getAuth().signOut()
  useAuthStore().user = null
}

/** Signs in, then goes to the front page */
export const signinUser = async (email: string, password: string) => {
  await signInHere(email, password)
  await navigateTo(useLocalePath()('/'))
}

/** Signs out, leaving a protected page for the front page before the local user is gone */
export const signoutUser = async () => {
  const localePath = useLocalePath()
  await endSession()
  await navigateTo(localePath('/'))
  await getAuth().signOut()
  useAuthStore().user = null
}

/** Deletes the signed-in user and everything stored about them, then signs out here */
export const deleteSignedInUser = async () => {
  const localePath = useLocalePath()

  // the server also clears the session cookie
  await $fetch('/api/v1/user', { method: 'DELETE', body: {} })

  // leave the protected page before the local user disappears
  await navigateTo(localePath('/'))
  await getAuth().signOut()
  useAuthStore().user = null
}

/** Sends a password reset e-mail */
export const requestPasswordReset = (email: string) =>
  sendPasswordResetEmail(getAuth(), email)

/**
 * Follows the browser's Firebase sign-in for the life of the app: loads the user, or signs out
 * when the server has no session for it
 */
export const followSignIn = () => {
  const auth = getAuth()
  const authStore = useAuthStore()

  onAuthStateChanged(auth, async (user) => {
    // signing in or opening an account loads its own user once the session exists
    if (authStore.signingIn) return

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

    authStore.user = await loadUser(idToken)
  })
}
