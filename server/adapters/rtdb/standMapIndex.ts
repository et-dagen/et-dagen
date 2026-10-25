import type { Database } from 'firebase-admin/database'
import type { StandMapIndex } from '@/application/fair/standMapIndex'
import { FairDay } from '@/domain/fair/day'
import { FileId } from '@/domain/files/file'

/** Stand maps by day in the Realtime Database, as `fair/standmaps/<YYYY-MM-DD>: <file id>` */
export function rtdbStandMapIndex(db: Database): StandMapIndex {
  const days = db.ref('fair/standmaps')

  return {
    all: async () => {
      const value = ((await days.once('value')).val() ?? {}) as Record<
        string,
        string
      >
      return new Map(
        Object.entries(value).flatMap(([day, id]) => {
          const parsed = FairDay.tryParse(day)
          return parsed ? [[parsed, FileId.parse(id)] as const] : []
        }),
      )
    },
    set: async (day, file) => {
      await days.child(day).set(file)
    },
    remove: async (day) => {
      await days.child(day).remove()
    },
  }
}
