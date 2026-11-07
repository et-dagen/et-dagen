import type { RetentionNotices } from '@/application/users/retentionNotices'
import type { Instant } from '@/domain/time'
import type { UserUid } from '@/domain/user'

/** Warnings held in a map, for tests */
export function memoryRetentionNotices(
  seed: Iterable<readonly [UserUid, Instant]> = [],
): RetentionNotices {
  const notices = new Map<UserUid, Instant>(seed)
  return {
    all: () => Promise.resolve(new Map(notices)),
    record: (user, at) => {
      notices.set(user, at)
      return Promise.resolve()
    },
    remove: (users) => {
      for (const user of users) notices.delete(user)
      return Promise.resolve()
    },
  }
}
