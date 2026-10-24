import type { UserDirectory } from '@/application/users/userDirectory'
import type { UserUid } from '@/domain/user'

/** Accounts held in a set, for tests and local work */
export const memoryUserDirectory = (
  uids: Iterable<UserUid> = [],
): UserDirectory => {
  const accounts = new Set(uids)
  return { exists: (uid) => Promise.resolve(accounts.has(uid)) }
}
