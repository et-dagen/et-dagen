import type { FairDay } from '@/domain/fair/day'
import type { FileId } from '@/domain/files/file'

/**
 * Which stand map belongs to which fair day
 *
 * @remarks
 * Only the link from day to file. The file itself, with its owner and name, is in the
 * {@link FileRepository}, like every other stored file.
 */
export interface StandMapIndex {
  all(): Promise<Map<FairDay, FileId>>
  set(day: FairDay, file: FileId): Promise<void>
  /** Removing a day without a map is not an error */
  remove(day: FairDay): Promise<void>
}
