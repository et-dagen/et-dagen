import type { FairInfoRepository } from '@/application/fair/fairInfoRepository'
import type { FairDates } from '@/domain/fair/dates'

/** The fair's details held in memory, for tests */
export function memoryFairInfoRepository(
  seed: FairDates | null = null,
): FairInfoRepository {
  let dates = seed
  return {
    dates: () => Promise.resolve(dates),
    setDates: (next) => {
      dates = next
      return Promise.resolve()
    },
  }
}
