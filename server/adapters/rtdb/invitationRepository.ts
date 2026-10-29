import type { Database } from 'firebase-admin/database'
import type { InvitationRepository } from '@/application/invitations/invitationRepository'
import { CompanyUid } from '@/domain/business/company'
import {
  InvitationId,
  type Invitation,
  type TokenHash,
} from '@/domain/business/invitation'
import { EmailAddress } from '@/domain/email'
import type { ISO8601String } from '@/domain/time'
import { UserUid } from '@/domain/user'

/** `invitations/<id>` as stored */
interface InvitationRecord {
  company: string
  email: string
  tokenHash: string
  invitedBy: string
  // written by `recordOf`, so already in the canonical form
  createdAt: ISO8601String
  expiresAt: ISO8601String
  revokedAt?: ISO8601String
  redeemedBy?: string
  redeemedAt?: ISO8601String
}

const recordOf = (invitation: Invitation): InvitationRecord => ({
  company: invitation.company,
  email: invitation.email,
  tokenHash: invitation.tokenHash,
  invitedBy: invitation.invitedBy,
  createdAt: invitation.createdAt,
  expiresAt: invitation.expiresAt,
  ...(invitation.revokedAt && { revokedAt: invitation.revokedAt }),
  ...(invitation.redeemed && {
    redeemedBy: invitation.redeemed.by,
    redeemedAt: invitation.redeemed.at,
  }),
})

const invitationOf = (id: string, record: InvitationRecord): Invitation => ({
  id: InvitationId.parse(id),
  company: CompanyUid.parse(record.company),
  email: EmailAddress.parse(record.email),
  tokenHash: record.tokenHash as TokenHash,
  invitedBy: UserUid.parse(record.invitedBy),
  createdAt: record.createdAt,
  expiresAt: record.expiresAt,
  revokedAt: record.revokedAt ?? null,
  redeemed:
    record.redeemedBy && record.redeemedAt
      ? {
          by: UserUid.parse(record.redeemedBy),
          at: record.redeemedAt,
        }
      : null,
})

const all = (value: unknown) =>
  Object.entries((value ?? {}) as Record<string, InvitationRecord>).map(
    ([id, record]) => invitationOf(id, record),
  )

/**
 * Invitations in the Realtime Database under `invitations/`
 *
 * @remarks
 * The queries use `once`, which filters on the client when the rules have no `.indexOn` for
 * `tokenHash` and `company`; `get` would refuse. Adding both to the rules makes them indexed.
 */
export function rtdbInvitationRepository(db: Database): InvitationRepository {
  const invitations = () => db.ref('invitations')
  return {
    save: async (invitation) => {
      await invitations().child(invitation.id).set(recordOf(invitation))
    },
    find: async (id) => {
      const record = (await invitations().child(id).get()).val()
      return record ? invitationOf(id, record) : null
    },
    byToken: async (hash) => {
      const snapshot = await invitations()
        .orderByChild('tokenHash')
        .equalTo(hash)
        .limitToFirst(1)
        .once('value')
      return all(snapshot.val())[0] ?? null
    },
    forCompany: async (company) => {
      const snapshot = await invitations()
        .orderByChild('company')
        .equalTo(company)
        .once('value')
      return all(snapshot.val()).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )
    },
  }
}
