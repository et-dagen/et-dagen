import {
  createUserWithEmailAndPassword,
  getAuth,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { startSession } from '@/composables/auth/session'
import type { StudentSignup } from '@/contracts/user'
import type { User } from '@/models/User'
import { useAuthStore } from '@/stores/authStore'

/**
 * Opens a student account: the Firebase account, then the profile, then a session, and goes to
 * the front page
 *
 * @remarks
 * The sign-up form's schema has checked the values. An account whose profile cannot be stored is
 * deleted again, or it would block the next try with "e-mail taken".
 */
export const registerUser = async (newUser: StudentSignup) => {
  const authStore = useAuthStore()
  const localePath = useLocalePath()

  // keeps the auth state listener from loading a user that has no profile yet
  authStore.signingIn = true
  try {
    const { user } = await createUserWithEmailAndPassword(
      getAuth(),
      newUser.email,
      newUser.password,
    )
    try {
      await saveProfile(user, newUser)
    } catch (cause) {
      await user.delete().catch(() => {})
      throw cause
    }
  } finally {
    authStore.signingIn = false
  }
  await navigateTo(localePath('/'))
}

async function saveProfile(user: FirebaseUser, newUser: StudentSignup) {
  await updateProfile(user, { displayName: newUser.name })

  // a fresh token carries the name; the session started from it keeps its claims for two weeks
  const idToken = await user.getIdToken(true)
  const headers = { Authorization: `Bearer ${idToken}` }
  await $fetch('/api/v1/user', {
    method: 'POST',
    headers,
    body: {
      studyProgram: newUser.studyProgram,
      currentYear: newUser.currentYear,
      dietaryRestrictions: newUser.dietaryRestrictions,
    },
  })

  // the new account stays signed in, as after signing in
  await startSession(idToken)
  useAuthStore().user = await $fetch<User>('/api/v1/user', { headers })
}
