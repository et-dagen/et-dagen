import type { ActivityLog } from '@/application/activity/activityLog'
import type {
  ActivityDay,
  JournalEntry,
  Tallies,
  Tally,
} from '@/domain/activity/activity'

/** The activity log held in memory, for tests */
export function memoryActivityLog(): ActivityLog {
  const journal: JournalEntry[] = []
  const days = new Map<ActivityDay, Tallies>()

  return {
    note: (entry) => {
      journal.push({ ...entry })
      return Promise.resolve()
    },
    tally: (day, counts) => {
      const stored = days.get(day) ?? {}
      for (const [name, n] of Object.entries(counts) as [Tally, number][])
        stored[name] = (stored[name] ?? 0) + n
      days.set(day, stored)
      return Promise.resolve()
    },
    entries: (since, limit) =>
      Promise.resolve(
        journal
          .filter((entry) => entry.at >= since)
          .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
          .slice(0, limit)
          .map((entry) => ({ ...entry })),
      ),
    tallies: (from) =>
      Promise.resolve(
        [...days]
          .filter(([day]) => day >= from)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([day, counts]) => ({ day, counts: { ...counts } })),
      ),
    forget: (before) => {
      const kept = journal.filter((entry) => entry.at >= before)
      journal.splice(0, journal.length, ...kept)
      return Promise.resolve()
    },
  }
}
