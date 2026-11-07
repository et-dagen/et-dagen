import { Duration, Instant } from './time'

/**
 * How many years E&T-dagene keeps data about a user after their last activity (#585)
 *
 * Counted in calendar years, so the limit falls on the same date three years later.
 */
export const RETENTION_YEARS = 3

/**
 * How long before the limit a user is warned by email
 *
 * Long enough that someone who reads mail rarely still has time to sign in, which keeps the account.
 */
export const NOTICE_LEAD = Duration.fromDays(30)

/** When the data of a user last active at `lastActive` is erased */
export function retentionLimitOf(lastActive: Instant): Instant {
  const limit = Instant.toDate(lastActive)
  limit.setUTCFullYear(limit.getUTCFullYear() + RETENTION_YEARS)
  return Instant.of(limit)
}

/** Whether a user last active at `lastActive` has passed the retention limit by `now` */
export function isPastRetention(lastActive: Instant, now: Instant): boolean {
  return Instant.compare(retentionLimitOf(lastActive), now) <= 0
}

/**
 * Whether a user should be warned now that their data is about to be erased
 *
 * @param noticedAt when the user was last warned, or null if never
 *
 * @remarks
 * One warning per period of inactivity: a notice sent before the user was last active belongs to
 * an earlier period, so it does not count. Activity moves the limit, so nothing has to reset it.
 */
export function isDueForNotice(
  lastActive: Instant,
  noticedAt: Instant | null,
  now: Instant,
): boolean {
  const limit = retentionLimitOf(lastActive)
  const inWindow =
    Instant.compare(now, Instant.sub(limit, NOTICE_LEAD)) >= 0 &&
    Instant.compare(now, limit) < 0
  const warned =
    noticedAt !== null && Instant.compare(noticedAt, lastActive) >= 0
  return inWindow && !warned
}
