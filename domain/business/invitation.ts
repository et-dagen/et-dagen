import type { Brand } from '@/domain/brand'
import type { CompanyUid } from '@/domain/business/company'
import type { EmailAddress } from '@/domain/email'
import { Duration, Instant, type ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'
import { UUIDv4 } from '@/domain/uuid'

/** Identifies an invitation in the admin; never the secret in the link */
export type InvitationId = Brand<UUIDv4, 'InvitationId'>

export const InvitationId = {
  /** @throws RangeError when the value is not a version 4 UUID */
  parse: (value: string): InvitationId => UUIDv4.parse(value) as InvitationId,
  random: (): InvitationId => UUIDv4.random() as InvitationId,
}

/**
 * The SHA-256 of an invitation's link token, in hex
 *
 * @remarks
 * Only the hash is stored, so reading the database never yields a link that works.
 */
export type TokenHash = Brand<string, 'TokenHash'>

/** How long a link works after it is sent */
export const INVITATION_LIFETIME = Duration.fromSeconds(14 * 24 * 60 * 60)

/**
 * An email address asked to join a company as one of its contacts
 *
 * @remarks
 * Replaces registration codes: the link goes to one address, works once, runs out and can be
 * revoked, and the admin sees who joined.
 */
export interface Invitation {
  id: InvitationId
  company: CompanyUid
  email: EmailAddress
  tokenHash: TokenHash
  invitedBy: UserUid
  createdAt: ISO8601String
  expiresAt: ISO8601String
  revokedAt: ISO8601String | null
  redeemed: { by: UserUid; at: ISO8601String } | null
}

export type InvitationStatus = 'pending' | 'joined' | 'expired' | 'revoked'

/** Where an invitation stands at `now`; a used or revoked one never turns back to pending */
export function statusOf(
  invitation: Pick<Invitation, 'expiresAt' | 'revokedAt' | 'redeemed'>,
  now: ISO8601String,
): InvitationStatus {
  if (invitation.redeemed) return 'joined'
  if (invitation.revokedAt) return 'revoked'
  return Instant.compare(now, invitation.expiresAt) >= 0 ? 'expired' : 'pending'
}
