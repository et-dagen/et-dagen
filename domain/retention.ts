import { Instant } from './time'

/**
 * How many years E&T-dagene keeps data about a user after their last activity (#585)
 *
 * Counted in calendar years, so the limit falls on the same date three years later.
 */
export const RETENTION_YEARS = 3

/** Whether a user last active at `lastActive` has passed the retention limit by `now` */
export function isPastRetention(lastActive: Instant, now: Instant): boolean {
  const limit = Instant.toDate(lastActive)
  limit.setUTCFullYear(limit.getUTCFullYear() + RETENTION_YEARS)
  return limit.getTime() <= Instant.toDate(now).getTime()
}
