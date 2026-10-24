import type {
  EventRepository,
  Missing,
} from '@/application/events/eventRepository'
import type { UserDirectory } from '@/application/users/userDirectory'
import type { Verdict } from '@/domain/authorization/eligibility'
import { hasPermission } from '@/domain/authorization/hasPermission'
import type { Subject } from '@/domain/authorization/subject'
import type { EventUid } from '@/domain/event/event'
import { admits, isOpen, type Registration } from '@/domain/event/registration'
import type { RegisterOutcome, WithdrawOutcome } from '@/domain/event/roster'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/** One user signing up for, or leaving, one event */
export interface RegistrationRequest {
  subject: Subject
  event: EventUid
  /** Whose place it is: the subject's own, unless an admin acts for someone else */
  user: UserUid
  now: ISO8601String
}

/**
 * Why the subject may not make the change, in the order the reasons are checked
 *
 * @remarks
 * `forbidden` covers a role with no grant at all, such as a company user.
 */
export type Denied =
  | { kind: 'not-own' }
  | { kind: 'closed' }
  | { kind: 'forbidden' }

/** The student does not meet the event's rule; `verdict` says which part */
export interface NotEligible {
  kind: 'not-eligible'
  verdict: Exclude<Verdict, { ok: true }>
}

export type RegisterResult =
  | RegisterOutcome
  | Missing
  | Denied
  | NotEligible
  /** An admin named a user who has no account */
  | { kind: 'user-not-found' }
export type WithdrawResult = WithdrawOutcome | Missing | Denied

/**
 * Sign a user up for an event, or queue them when it is full
 *
 * @remarks
 * `hasPermission` decides; the reasons are only worked out after a denial, so a rule change in
 * `domain/authorization` cannot be bypassed here. The roster change itself is one atomic
 * repository operation, so two people taking the last spot end with one attendant and one queued.
 */
export async function registerForEvent(
  { events, users }: { events: EventRepository; users: UserDirectory },
  request: RegistrationRequest,
): Promise<RegisterResult> {
  const registration = await registrationOf(events, request.event)
  if ('kind' in registration) return registration

  const target = { targetUserUid: request.user, event: { registration } }
  if (
    !hasPermission(request.subject, 'registration', 'create', target, {
      now: request.now,
    })
  ) {
    return (
      notOwnOrClosed(request, registration) ??
      notEligible(request, registration) ?? { kind: 'forbidden' }
    )
  }
  if (
    request.user !== request.subject.uid &&
    !(await users.exists(request.user))
  ) {
    return { kind: 'user-not-found' }
  }
  return events.registerOrQueue(request.event, request.user, request.now)
}

/**
 * Take a user off an event or its queue, moving the first in the queue into a freed spot
 */
export async function withdrawFromEvent(
  { events }: { events: EventRepository },
  request: RegistrationRequest,
): Promise<WithdrawResult> {
  const registration = await registrationOf(events, request.event)
  if ('kind' in registration) return registration

  const target = { targetUserUid: request.user, event: { registration } }
  if (
    !hasPermission(request.subject, 'registration', 'delete', target, {
      now: request.now,
    })
  ) {
    return notOwnOrClosed(request, registration) ?? { kind: 'forbidden' }
  }
  return events.withdraw(request.event, request.user, request.now)
}

async function registrationOf(
  events: EventRepository,
  uid: EventUid,
): Promise<Registration | Missing> {
  const stored = await events.find(uid)
  if (!stored) return { kind: 'event-not-found' }
  return stored.event.registration ?? { kind: 'no-registration' }
}

function notOwnOrClosed(
  { subject, user, now }: RegistrationRequest,
  registration: Registration,
): Denied | null {
  if (user !== subject.uid) return { kind: 'not-own' }
  if (!isOpen(registration, now)) return { kind: 'closed' }
  return null
}

function notEligible(
  { subject }: RegistrationRequest,
  registration: Registration,
): NotEligible | null {
  const verdict = admits(registration, subject.applicant)
  return verdict.ok ? null : { kind: 'not-eligible', verdict }
}
