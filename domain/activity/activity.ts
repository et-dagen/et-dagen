import {
  Duration,
  Instant,
  TimeZone,
  Zone,
  type ISO8601String,
} from '@/domain/time'
import type { UserUid } from '@/domain/user'

/**
 * What the dashboard counts per day
 *
 * @remarks
 * Numbers only, with no one in them, so the tallies are kept after the journal is dropped.
 */
export const TALLIES = [
  'sign-up',
  'sign-in',
  'registration',
  'cancellation',
  'attendance',
  'resume-download',
  'page-view',
  'refusal',
  'error',
] as const
export type Tally = (typeof TALLIES)[number]
export type Tallies = Partial<Record<Tally, number>>

export const isTally = (value: unknown): value is Tally =>
  (TALLIES as readonly unknown[]).includes(value)

/** What the journal lists one by one, for security */
export const NOTABLE = [
  'refused',
  'failed',
  'access-changed',
  'contract-changed',
  'deleted',
] as const
export type Notable = (typeof NOTABLE)[number]

export const isNotable = (value: unknown): value is Notable =>
  (NOTABLE as readonly unknown[]).includes(value)

/**
 * One request worth a second look
 *
 * @remarks
 * Holds the least that tells an admin what happened: no email, name, address or query string.
 * The actor is a uid, which the admin pages resolve when someone needs to know who it was.
 */
export interface JournalEntry {
  at: ISO8601String
  kind: Notable
  method: string
  path: string
  status: number
  /** The error catalogue's code, when the request failed with one */
  code: string | null
  actor: UserUid | null
  /** The user, company or record acted on, when the request names one */
  target: string | null
}

/**
 * How many days the journal keeps an entry
 *
 * @remarks
 * Pending approval: the head of IT on the board decides how long personal data in logs is kept.
 */
export const ACTIVITY_RETENTION_DAYS = 30

/** A calendar day in Oslo, `YYYY-MM-DD`, which is how the fair counts its days */
export type ActivityDay = string

const OSLO = TimeZone.parse('Europe/Oslo')
const pad = (n: number) => String(n).padStart(2, '0')

export const dayOf = (at: ISO8601String): ActivityDay => {
  const { year, month, day } = Zone.toLocal(at, OSLO)
  return `${year}-${pad(month)}-${pad(day)}`
}

/** The oldest instant the journal still keeps at `now` */
export const keptSince = (now: ISO8601String): ISO8601String =>
  Instant.sub(now, Duration.fromDays(ACTIVITY_RETENTION_DAYS))
