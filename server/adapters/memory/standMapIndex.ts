import type { StandMapIndex } from '@/application/fair/standMapIndex'
import type { FairDay } from '@/domain/fair/day'
import type { FileId } from '@/domain/files/file'

/** Stand maps by day held in a map, for tests */
export function memoryStandMapIndex(): StandMapIndex {
  const days = new Map<FairDay, FileId>()
  return {
    all: () => Promise.resolve(new Map(days)),
    set: (day, file) => {
      days.set(day, file)
      return Promise.resolve()
    },
    remove: (day) => {
      days.delete(day)
      return Promise.resolve()
    },
  }
}
