import type {
  ActivityDay,
  JournalEntry,
  Tallies,
} from '@/domain/activity/activity'
import type { ISO8601String } from '@/domain/time'

/** The admin dashboard's store: a journal of notable requests and a tally per day */
export interface ActivityLog {
  note(entry: JournalEntry): Promise<void>
  /** Add to a day's tallies; adds from several servers at once all count */
  tally(day: ActivityDay, counts: Tallies): Promise<void>
  /** Entries at or after `since`, newest first, at most `limit` */
  entries(since: ISO8601String, limit: number): Promise<JournalEntry[]>
  /** Each day's tallies from `from` on, oldest first; days with nothing are left out */
  tallies(from: ActivityDay): Promise<{ day: ActivityDay; counts: Tallies }[]>
  /** Drop journal entries before `before`; the tallies stay */
  forget(before: ISO8601String): Promise<void>
}
