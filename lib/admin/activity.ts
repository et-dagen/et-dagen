import type { ActivityOverview } from '@/application/activity/overview'
import type {
  ActivityDay,
  JournalEntry,
  Notable,
  Tallies,
  Tally,
} from '@/domain/activity/activity'

/** The tallies the dashboard shows, in its order */
export const SHOWN_TALLIES = [
  'page-view',
  'sign-up',
  'sign-in',
  'registration',
  'cancellation',
  'attendance',
  'resume-download',
  'refusal',
  'error',
] as const satisfies readonly Tally[]

const nextDay = (day: ActivityDay): ActivityDay => {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

/**
 * One row per day from `from` to `today`, newest first, with zeros for days nothing was counted
 */
export function dailyRows(
  overview: Pick<ActivityOverview, 'from' | 'tallies'>,
  today: ActivityDay,
): { day: ActivityDay; counts: Tallies }[] {
  const counted = new Map(overview.tallies.map((t) => [t.day, t.counts]))
  const rows = []
  for (let day = overview.from; day <= today; day = nextDay(day))
    rows.push({ day, counts: counted.get(day) ?? {} })
  return rows.reverse()
}

/** Each tally summed over the rows */
export const totalsOf = (rows: readonly { counts: Tallies }[]): Tallies => {
  const totals: Tallies = {}
  for (const { counts } of rows)
    for (const tally of SHOWN_TALLIES)
      totals[tally] = (totals[tally] ?? 0) + (counts[tally] ?? 0)
  return totals
}

/** How many entries of each kind, for the filter */
export const kindCounts = (
  entries: readonly JournalEntry[],
): Partial<Record<Notable, number>> => {
  const counts: Partial<Record<Notable, number>> = {}
  for (const { kind } of entries) counts[kind] = (counts[kind] ?? 0) + 1
  return counts
}

export type { ActivityOverview }
