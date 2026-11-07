import { describe, expect, it } from 'vitest'
import { pruneInvitations } from '@/application/invitations/pruning'
import { CompanyUid } from '@/domain/business/company'
import {
  InvitationId,
  type Invitation,
  type TokenHash,
} from '@/domain/business/invitation'
import { EmailAddress } from '@/domain/email'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { memoryInvitationRepository } from '@/server/adapters/memory/invitationRepository'

const at = (iso: string) => Instant.parse(iso as never)
const invitation = (overrides: Partial<Invitation>): Invitation => ({
  id: InvitationId.random(),
  company: CompanyUid.parse('acme'),
  email: EmailAddress.parse('kari@acme.no'),
  tokenHash: 'hash' as TokenHash,
  invitedBy: UserUid.parse('admin'),
  createdAt: at('2026-01-01T10:00:00.000Z'),
  expiresAt: at('2026-01-15T10:00:00.000Z'),
  revokedAt: null,
  redeemed: null,
  ...overrides,
})

describe('pruneInvitations', () => {
  it('deletes the invitations 90 days after they stopped working, and keeps the rest', async () => {
    const invitations = memoryInvitationRepository()
    const expired = invitation({})
    const joinedLately = invitation({
      redeemed: {
        by: UserUid.parse('kari'),
        at: at('2026-03-01T10:00:00.000Z'),
      },
    })
    const pending = invitation({ expiresAt: at('2026-04-20T10:00:00.000Z') })
    for (const each of [expired, joinedLately, pending]) {
      await invitations.save(each)
    }

    const removed = await pruneInvitations(
      { invitations },
      at('2026-04-15T10:00:00.000Z'),
    )

    expect(removed).toBe(1)
    expect((await invitations.all()).map((i) => i.id).sort()).toEqual(
      [joinedLately.id, pending.id].sort(),
    )
  })
})
