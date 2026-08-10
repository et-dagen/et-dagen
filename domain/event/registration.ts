import {
  satisfies,
  type Applicant,
  type EligibilityRule,
} from '@/domain/authorization/eligibility'
import type { ISO8601String } from '@/domain/time/instant'
import { contains, type Interval } from '@/domain/time/interval'

/**
 * The terms on which students may sign up for an event
 *
 * @remarks
 * Two limits that are deliberately independent: `attendanceLimit` caps how many may come, and
 * `eligibility` decides who may ask. An event with a limit but no rule is open to every student
 * until the spots run out, which is the common case.
 */
export interface Registration {
  /** When sign-up opens, and for how long it stays open */
  period: Interval
  /** Maximum attendees, or null when only the venue decides */
  attendanceLimit: number | null
  /** Omitted when any student may register */
  eligibility?: EligibilityRule
}

/**
 * Whether sign-up is open at an instant
 *
 * @remarks
 * Half-open, so an event opens exactly at `period.start` and shuts the instant it ends. Callers
 * holding a `Date` — the authorization layer's `Environment.now`, for one — convert with
 * `Instant.of` so the conversion happens once, at the boundary.
 */
export const isOpen = (
  registration: Registration,
  now: ISO8601String,
): boolean => contains(registration.period, now)

/**
 * Whether any spots remain
 *
 * @param attending Registrations already accepted for the event
 */
export const hasSpots = (
  registration: Registration,
  attending: number,
): boolean =>
  registration.attendanceLimit === null ||
  attending < registration.attendanceLimit

/**
 * Whether an event's rule admits this applicant
 *
 * @remarks
 * An event with no rule admits everyone, so callers need not repeat that convention.
 */
export const admits = (
  registration: Registration,
  applicant: Applicant,
): boolean =>
  !registration.eligibility || satisfies(registration.eligibility, applicant)
