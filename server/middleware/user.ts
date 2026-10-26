import { whoIsAsking } from '@/application/users/subject'
import type { Subject } from '@/domain/authorization/subject'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { companies, profiles } from '@/server/composition'

export default defineEventHandler(async (event) => {
  const { decodedToken, wideEvent } = event.context

  if (!decodedToken) return

  // Track database read for wide event
  const dbReadStart = Date.now()

  const asking = await whoIsAsking(
    { users: profiles, companies },
    UserUid.parse(decodedToken.uid),
    Instant.now(),
  )

  // Track database operation in wide event
  trackDbRead(event, `users/${decodedToken.uid}`, dbReadStart)

  // user not in database
  if (!asking) return

  const userData = asking.record as Record<string, any>

  event.context.subject = asking.subject
  event.context.user = {
    ...formatFirebaseUser(decodedToken),
    ...userData,
  }

  // Enrich wide event with user context
  if (wideEvent) {
    wideEvent.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name ?? userData?.name,
      access_level: userData?.accessLevel,
      study_program: userData?.studyProgram,
      current_year: userData?.currentYear,
    }
  }
})

declare module 'h3' {
  interface H3EventContext {
    /** Who sent the request; absent when nobody is signed in or the user has no profile */
    subject?: Subject
  }
}
