import type { InvitationRepository } from '@/application/invitations/invitationRepository'
import { isPastKeeping } from '@/domain/business/invitation'
import type { ISO8601String } from '@/domain/time'

/**
 * Delete the invitations kept past their time, and with them the invitee's address
 *
 * @returns how many were deleted
 */
export async function pruneInvitations(
  deps: { invitations: Pick<InvitationRepository, 'all' | 'remove'> },
  now: ISO8601String,
): Promise<number> {
  const old = (await deps.invitations.all()).filter((invitation) =>
    isPastKeeping(invitation, now),
  )
  await deps.invitations.remove(old.map((invitation) => invitation.id))
  return old.length
}
