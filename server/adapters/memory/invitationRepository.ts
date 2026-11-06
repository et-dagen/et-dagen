import type { InvitationRepository } from '@/application/invitations/invitationRepository'
import type { Invitation, InvitationId } from '@/domain/business/invitation'

/** Invitations held in a map, for tests */
export function memoryInvitationRepository(): InvitationRepository {
  const invitations = new Map<InvitationId, Invitation>()
  return {
    save: (invitation) => {
      invitations.set(invitation.id, invitation)
      return Promise.resolve()
    },
    find: (id) => Promise.resolve(invitations.get(id) ?? null),
    byToken: (hash) =>
      Promise.resolve(
        [...invitations.values()].find((i) => i.tokenHash === hash) ?? null,
      ),
    forCompany: (company) =>
      Promise.resolve(
        [...invitations.values()]
          .filter((i) => i.company === company)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),
  }
}
