import type { Event, HasRegistration } from '@/domain/event/event'
import type {
  PromoteOutcome,
  RegisterOutcome,
  Roster,
  WithdrawOutcome,
} from '@/domain/event/roster'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/** An event with its roster, as stored */
export interface StoredEvent {
  event: Event & Partial<HasRegistration>
  roster: Roster
}

/** Why an operation found nothing to act on */
export type Missing =
  | { kind: 'event-not-found' }
  /** The event takes no sign-ups, so it has no roster to change */
  | { kind: 'no-registration' }

/**
 * Where events and their rosters live
 *
 * @remarks
 * Each roster method is one whole operation, which the adapter performs atomically: two users
 * taking the last spot at once must end with one attendant and one in the queue. Every adapter
 * passes the same contract suite, so a use case cannot tell them apart.
 */
export interface EventRepository {
  /** null when no event has this uid */
  find(uid: Event['uid']): Promise<StoredEvent | null>

  /** Every event the user is coming to or waiting for */
  withUser(user: UserUid): Promise<StoredEvent[]>

  /** Apply the domain's `register` to the stored roster, atomically */
  registerOrQueue(
    uid: Event['uid'],
    user: UserUid,
    at: ISO8601String,
  ): Promise<RegisterOutcome | Missing>

  /** Apply the domain's `withdraw` to the stored roster, atomically */
  withdraw(
    uid: Event['uid'],
    user: UserUid,
    at: ISO8601String,
  ): Promise<WithdrawOutcome | Missing>

  /** Apply the domain's `promoteWaiting` to the stored roster, atomically */
  promoteWaiting(
    uid: Event['uid'],
    at: ISO8601String,
  ): Promise<PromoteOutcome | Missing>

  /**
   * Apply the domain's `removeUsers` to every event the users are on
   *
   * @remarks
   * Each event changes atomically on its own, not all of them together. Running it again after a
   * failure finishes the job, because events the users have left are skipped.
   */
  removeUsers(users: readonly UserUid[], at: ISO8601String): Promise<void>
}
