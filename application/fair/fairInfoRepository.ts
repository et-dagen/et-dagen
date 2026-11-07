import type { FairDates } from '@/domain/fair/dates'

/** The fair's own details, which the landing page shows */
export interface FairInfoRepository {
  /** null when no dates are set */
  dates(): Promise<FairDates | null>
  setDates(dates: FairDates): Promise<void>
}
