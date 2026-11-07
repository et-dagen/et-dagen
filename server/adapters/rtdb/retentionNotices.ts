import type { Database } from 'firebase-admin/database'
import type { RetentionNotices } from '@/application/users/retentionNotices'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

/** Warnings under `retention/<uid>` in the Realtime Database, each the time it was sent */
export const rtdbRetentionNotices = (
  db: Pick<Database, 'ref'>,
): RetentionNotices => ({
  all: async () => {
    const stored = ((await db.ref('retention').once('value')).val() ??
      {}) as Record<string, unknown>
    return new Map(
      Object.entries(stored).flatMap(([uid, at]) => {
        const instant = typeof at === 'string' ? Instant.tryParse(at) : null
        return instant ? [[UserUid.parse(uid), instant] as const] : []
      }),
    )
  },
  record: async (user, at) => {
    await db.ref(`retention/${user}`).set(at)
  },
  remove: async (users) => {
    if (users.length === 0) return
    await db
      .ref('retention')
      .update(Object.fromEntries(users.map((uid) => [uid, null])))
  },
})
