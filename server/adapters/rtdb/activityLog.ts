import { ServerValue, type Database } from 'firebase-admin/database'
import type { ActivityLog } from '@/application/activity/activityLog'
import {
  isNotable,
  isTally,
  type JournalEntry,
  type Tallies,
} from '@/domain/activity/activity'
import { Instant, type ISO8601String } from '@/domain/time'
import { UserUid } from '@/domain/user'

/** `activity/journal/<key>` as stored */
interface EntryRecord {
  at: string
  kind: string
  method: string
  path: string
  status: number
  code?: string
  actor?: string
  target?: string
}

// keys sort by time, so a range of keys is a range of time and needs no index
const keyAt = (at: ISO8601String) =>
  String(Instant.toDate(at).getTime()).padStart(15, '0')

const toEntry = (record: EntryRecord): JournalEntry | null => {
  const at = Instant.tryParse(record.at ?? '')
  if (!at || !isNotable(record.kind)) return null
  return {
    at,
    kind: record.kind,
    method: record.method ?? '',
    path: record.path ?? '',
    status: record.status ?? 0,
    code: record.code ?? null,
    actor: record.actor ? UserUid.parse(record.actor) : null,
    target: record.target ?? null,
  }
}

const toCounts = (record: Record<string, unknown>): Tallies =>
  Object.fromEntries(
    Object.entries(record).filter(
      ([name, n]) => isTally(name) && typeof n === 'number',
    ),
  )

/** The activity log in the Realtime Database under `activity/` */
export function rtdbActivityLog(db: Database): ActivityLog {
  const journal = () => db.ref('activity/journal')
  const tallies = () => db.ref('activity/tallies')

  return {
    note: async ({ code, actor, target, ...entry }) => {
      const key = `${keyAt(entry.at)}-${journal().push().key}`
      await journal()
        .child(key)
        .set({
          ...entry,
          ...(code && { code }),
          ...(actor && { actor }),
          ...(target && { target }),
        })
    },

    tally: async (day, counts) => {
      const update: Record<string, object> = {}
      for (const [name, n] of Object.entries(counts))
        if (n) update[`${day}/${name}`] = ServerValue.increment(n)
      if (Object.keys(update).length) await tallies().update(update)
    },

    entries: async (since, limit) => {
      const snapshot = await journal()
        .orderByKey()
        .startAt(keyAt(since))
        .limitToLast(limit)
        .get()
      const records = Object.entries(
        (snapshot.val() ?? {}) as Record<string, EntryRecord>,
      ).sort(([a], [b]) => (a < b ? 1 : -1))
      return records.flatMap(([, record]) => toEntry(record) ?? [])
    },

    tallies: async (from) => {
      const snapshot = await tallies().orderByKey().startAt(from).get()
      return Object.entries(
        (snapshot.val() ?? {}) as Record<string, Record<string, unknown>>,
      )
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([day, record]) => ({ day, counts: toCounts(record) }))
    },

    forget: async (before) => {
      const snapshot = await journal()
        .orderByKey()
        .endBefore(keyAt(before))
        .get()
      const keys = Object.keys(snapshot.val() ?? {})
      if (keys.length)
        await journal().update(
          Object.fromEntries(keys.map((key) => [key, null])),
        )
    },
  }
}
