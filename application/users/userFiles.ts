import type { UserUid } from '@/domain/user'

/** Files users upload, such as their résumé */
export interface UserFiles {
  /** Delete every file the users own. Users without files count as done. */
  remove(users: readonly UserUid[]): Promise<void>
}
