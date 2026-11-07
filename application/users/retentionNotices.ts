import type { Instant } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/**
 * When each user was last warned that their data is about to be erased
 *
 * @remarks
 * Kept apart from the profile, so a warning can be recorded for an account with no profile, and
 * erasure removes it like any other data about the user.
 */
export interface RetentionNotices {
  /** The time of each user's last warning, for the users ever warned */
  all(): Promise<ReadonlyMap<UserUid, Instant>>
  /** Record that the user was warned at `at`, replacing an earlier warning */
  record(user: UserUid, at: Instant): Promise<void>
  /** Forget the users' warnings. Users never warned count as forgotten. */
  remove(users: readonly UserUid[]): Promise<void>
}
