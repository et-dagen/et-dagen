import type { CompanyUid } from '@/domain/business/company'
import type {
  Invitation,
  InvitationId,
  TokenHash,
} from '@/domain/business/invitation'

/** The invitations sent to company contacts */
export interface InvitationRepository {
  /** Store an invitation, adding or replacing it by id */
  save(invitation: Invitation): Promise<void>
  /** null when no invitation has this id */
  find(id: InvitationId): Promise<Invitation | null>
  /** The invitation a link's token belongs to, or null */
  byToken(hash: TokenHash): Promise<Invitation | null>
  /** The company's invitations, newest first */
  forCompany(company: CompanyUid): Promise<Invitation[]>
}
