import type { ActivityLog } from '@/application/activity/activityLog'
import {
  ACTIVITY_RETENTION_DAYS,
  dayOf,
  keptSince,
  type ActivityDay,
  type JournalEntry,
  type Tallies,
} from '@/domain/activity/activity'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import { Duration, Instant, type ISO8601String } from '@/domain/time'

/** At most this many journal entries per answer, the newest */
export const JOURNAL_LIMIT = 500

export interface ActivityOverview {
  from: ActivityDay
  tallies: { day: ActivityDay; counts: Tallies }[]
  entries: JournalEntry[]
}

/**
 * The dashboard for the last `days` days, today included
 *
 * @remarks
 * Clamped to the journal's retention, so the tallies and the journal cover the same days.
 */
export async function activityOverview(
  log: ActivityLog,
  {
    subject,
    now,
    days,
  }: { subject: Subject | null; now: ISO8601String; days: number },
): Promise<ActivityOverview> {
  authorize(subject, 'activity', 'read', undefined, { now })

  const span = Math.min(
    Math.max(Math.trunc(days) || 1, 1),
    ACTIVITY_RETENTION_DAYS,
  )
  const from = dayOf(Instant.sub(now, Duration.fromDays(span - 1)))

  const [tallies, entries] = await Promise.all([
    log.tallies(from),
    log.entries(keptSince(now), JOURNAL_LIMIT),
  ])
  return { from, tallies, entries: entries.filter((e) => dayOf(e.at) >= from) }
}
