import type { AccessRepository } from '@/application/users/accessRepository'
import type { Access } from '@/domain/authorization/access'
import type { UserUid } from '@/domain/user'

/**
 * Roles and memberships held in a map, for tests and local work
 *
 * @remarks
 * `read` is not part of the port; tests use it to see what was stored.
 */
export function memoryAccessRepository(): AccessRepository & {
  read(user: UserUid): Access | undefined
} {
  const stored = new Map<UserUid, Access>()
  return {
    replace: (user, access) => {
      stored.set(user, structuredClone(access))
      return Promise.resolve()
    },
    find: (user) => Promise.resolve(stored.get(user) ?? null),
    all: () => Promise.resolve(new Map(stored)),
    read: (user) => stored.get(user),
  }
}
