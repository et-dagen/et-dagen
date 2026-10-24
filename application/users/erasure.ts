import type { EventRepository } from '@/application/events/eventRepository'
import type { UserDirectory } from '@/application/users/userDirectory'
import type { UserFiles } from '@/application/users/userFiles'
import type { UserRepository } from '@/application/users/userRepository'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

export interface ErasurePorts {
  files: UserFiles
  events: Pick<EventRepository, 'removeUsers'>
  profiles: UserRepository
  accounts: UserDirectory
}

/**
 * Remove everything stored about users: their files, their place on every event, their profile
 * and their account
 *
 * @remarks
 * Every step can run again after a failure without harm, and the account goes last: while it
 * exists, the deletion can be repeated by the user or the retention job. Leaving an upcoming
 * event moves the first in its queue into the freed spot, as opting out does.
 */
export async function eraseUsers(
  ports: ErasurePorts,
  users: readonly UserUid[],
  now: ISO8601String,
): Promise<void> {
  await ports.files.remove(users)
  await ports.events.removeUsers(users, now)
  await ports.profiles.remove(users)
  await ports.accounts.remove(users)
}
