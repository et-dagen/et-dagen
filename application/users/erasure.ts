import type { EventRepository } from '@/application/events/eventRepository'
import type { FileRepository } from '@/application/files/fileRepository'
import type { InvitationRepository } from '@/application/invitations/invitationRepository'
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
  /** Invitations name who joined by them */
  invitations: Pick<InvitationRepository, 'all' | 'remove'>
  profiles: UserRepository
  accounts: UserDirectory
}

/**
 * Remove everything stored about users: their files and the records of them, their place on
 * every event, the invitations they joined by, their profile and their account
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
  const erased = new Set<string>(users)
  const joinedBy = (await ports.invitations.all()).filter(
    (invitation) => invitation.redeemed && erased.has(invitation.redeemed.by),
  )
  await ports.invitations.remove(joinedBy.map((invitation) => invitation.id))
  await ports.profiles.remove(users)
  await ports.accounts.remove(users)
}
