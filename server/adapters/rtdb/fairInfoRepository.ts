import type { Database } from 'firebase-admin/database'
import type { FairInfoRepository } from '@/application/fair/fairInfoRepository'
import { WallClock } from '@/domain/fair/dates'

/** The fair's details under `generalInfo/` */
export function rtdbFairInfoRepository(
  db: Pick<Database, 'ref'>,
): FairInfoRepository {
  // a reference per call: building the adapter must not open a connection
  const date = () => db.ref('generalInfo/date')

  return {
    dates: async () => {
      const value = (await date().once('value')).val() as {
        start?: unknown
        end?: unknown
      } | null
      const start =
        typeof value?.start === 'string'
          ? WallClock.tryParse(value.start)
          : null
      const end =
        typeof value?.end === 'string' ? WallClock.tryParse(value.end) : null
      return start && end ? { start, end } : null
    },
    setDates: async (dates) => {
      await date().set(dates)
    },
  }
}
