import type { Brand } from '@/domain/brand'

/**
 * A time on the clock in Oslo, as `YYYY-MM-DDTHH:mm:ss`
 *
 * @remarks
 * The fair's dates are kept as Oslo wall-clock times, as v1 stored them; the landing page reads
 * them in Oslo.
 */
export type WallClock = Brand<string, 'WallClock'>

const SHAPE = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

export const WallClock = {
  /** null unless the value is a real date and time; seconds are optional and default to 00 */
  tryParse: (value: string): WallClock | null => {
    const match = SHAPE.exec(value.trim())
    if (!match) return null
    const [, day, hours, minutes, seconds = '00'] = match
    const normal = `${day}T${hours}:${minutes}:${seconds}`
    const date = new Date(`${normal}Z`)
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().startsWith(normal)
      ? (normal as WallClock)
      : null
  },
}

/** When the fair starts and ends */
export interface FairDates {
  start: WallClock
  end: WallClock
}

/** The fair's dates from a request, or why they cannot be used */
export function checkedFairDates(
  raw: unknown,
): FairDates | { problem: 'fair/invalid-dates' } {
  const body = (raw ?? {}) as Record<string, unknown>
  const start =
    typeof body.start === 'string' ? WallClock.tryParse(body.start) : null
  const end = typeof body.end === 'string' ? WallClock.tryParse(body.end) : null
  // the same shape sorts as text in time order
  if (!start || !end || end < start) return { problem: 'fair/invalid-dates' }
  return { start, end }
}
