import type { EventRepository } from '@/application/events/eventRepository'
import type { FileRepository } from '@/application/files/fileRepository'
import type { UserDirectory } from '@/application/users/userDirectory'
import type { UserFiles } from '@/application/users/userFiles'
import type { UserRepository } from '@/application/users/userRepository'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

export interface ErasurePorts {
  files: UserFiles
  /** The records of files, which name their owner and who uploaded them */
  records: Pick<FileRepository, 'ofOwner' | 'remove' | 'clearUploader'>
  events: Pick<EventRepository, 'removeUsers'>
  profiles: UserRepository
  accounts: UserDirectory
}

/**
 * Remove everything stored about users: their files and the records of them, their place on
 * every event, their profile and their account
 *
 * @remarks
 * Every step can run again after a failure without harm, and the account goes last: while it
 * exists, the deletion can be repeated by the user or the retention job. Leaving an upcoming
 * event moves the first in its queue into the freed spot, as opting out does. Files a user
 * uploaded for a company stay with the company, without the user as uploader.
 */
export async function eraseUsers(
  ports: ErasurePorts,
  users: readonly UserUid[],
  now: ISO8601String,
): Promise<void> {
  await ports.files.remove(users)
  for (const uid of users) {
    const owned = await ports.records.ofOwner({ kind: 'user', uid })
    for (const file of owned) await ports.records.remove(file.id)
    await ports.records.clearUploader(uid)
  }
  await ports.events.removeUsers(users, now)
  await ports.profiles.remove(users)
  await ports.accounts.remove(users)
}
