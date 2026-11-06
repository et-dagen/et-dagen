import type { FileId } from '@/domain/files/file'
import type { UserUid } from '@/domain/user'

/** Which file is each user's résumé */
export interface ResumeIndex {
  /**
   * What the user's profile points at: a file id, or a link stored before files had records;
   * null when the user has no résumé
   */
  of(user: UserUid): Promise<string | null>
  /** Point the user at a résumé file, or at none */
  set(user: UserUid, file: FileId | null): Promise<void>
}
