import type { UserDirectory } from '@/application/users/userDirectory'
import type { UserFiles } from '@/application/users/userFiles'
import type { UserRepository } from '@/application/users/userRepository'
import type { UserUid } from '@/domain/user'

/**
 * Users held in a set, standing in for any store keyed by user, for tests and local work
 *
 * @remarks
 * `has` is not part of any port; tests use it to see what is left.
 */
export function memoryUserStore(
  uids: Iterable<UserUid> = [],
): UserDirectory & UserRepository & UserFiles & { has(uid: UserUid): boolean } {
  const users = new Set(uids)
  return {
    exists: (uid) => Promise.resolve(users.has(uid)),
    remove: (removed) => {
      for (const uid of removed) users.delete(uid)
      return Promise.resolve()
    },
    has: (uid) => users.has(uid),
  }
}
