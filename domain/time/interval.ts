import type { Duration } from './duration'
import { Instant, type ISO8601String } from './instant'

/**
 * A span of the timeline anchored at a start instant
 *
 * @remarks
 * Stored as start plus length rather than start plus end. The two are equivalent, but only
 * this form makes "how long is it" a field read instead of a subtraction, and it cannot
 * represent an interval that ends before it begins.
 */
export interface Interval {
  start: ISO8601String
  duration: Duration
}

/**
 * The instant an interval ends
 */
export const endOf = ({ start, duration }: Interval): ISO8601String =>
  Instant.add(start, duration)

/**
 * Check whether an instant falls inside an interval
 *
 * @remarks
 * Half-open: an interval contains its start instant but not its end, so back-to-back
 * intervals never both claim the boundary.
 */
export const contains = (interval: Interval, instant: ISO8601String): boolean =>
  Instant.compare(instant, interval.start) >= 0 &&
  Instant.compare(instant, endOf(interval)) < 0

/**
 * Check if the current time is within a given boxed window
 *
 * @param start Start of the time window in question
 * @param end End of the time window
 * @param now Date subject to check
 *
 * @returns Boolean whether 'now' is within the window
 */
export const withinTimeWindow = (
  start: ISO8601String,
  end: ISO8601String,
  now: Date = new Date(),
): boolean => {
  const instant = Instant.of(now)
  return (
    Instant.compare(instant, start) >= 0 && Instant.compare(instant, end) < 0
  )
}
