import type { Contact, UserDirectory } from '@/application/users/userDirectory'
import type { UserUid } from '@/domain/user'

/** Accounts held in a set, for tests and local work; `known` gives accounts a name and email */
export const memoryUserDirectory = (
  uids: Iterable<UserUid> = [],
  known: ReadonlyMap<UserUid, Contact> = new Map(),
): UserDirectory => {
  const accounts = new Set(uids)
  return {
    exists: (uid) => Promise.resolve(accounts.has(uid)),
    contacts: (asked) =>
      Promise.resolve(
        new Map(
          asked
            .filter((uid) => accounts.has(uid))
            .map((uid) => [uid, known.get(uid) ?? { name: null, email: null }]),
        ),
      ),
    remove: (removed) => {
      for (const uid of removed) accounts.delete(uid)
      return Promise.resolve()
    },
  }
}
