/**
 * What every {@link InvitationRepository} adapter must do
 *
 * An adapter's test file calls {@link describeInvitationRepository} with a factory, so the suite
 * runs once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { InvitationRepository } from '@/application/invitations/invitationRepository'
import { CompanyUid } from '@/domain/business/company'
import {
  InvitationId,
  type Invitation,
  type TokenHash,
} from '@/domain/business/invitation'
import { EmailAddress } from '@/domain/email'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

const acme = CompanyUid.parse('acme')
const invitation = (
  createdAt: string,
  overrides: Partial<Invitation> = {},
): Invitation => ({
  id: InvitationId.random(),
  company: acme,
  email: EmailAddress.parse('kari@acme.no'),
  tokenHash: `hash-${createdAt}` as TokenHash,
  invitedBy: UserUid.parse('admin'),
  createdAt: Instant.parse(createdAt as never),
  expiresAt: Instant.parse('2026-12-01T00:00:00.000Z'),
  revokedAt: null,
  redeemed: null,
  ...overrides,
})

export function describeInvitationRepository(
  adapter: string,
  make: () => Promise<InvitationRepository> | InvitationRepository,
) {
  describe(`${adapter} InvitationRepository`, () => {
    it('finds an invitation by id and by token', async () => {
      const invitations = await make()
      const kari = invitation('2026-10-29T10:00:00.000Z')
      await invitations.save(kari)

      expect(await invitations.find(kari.id)).toEqual(kari)
      expect(await invitations.byToken(kari.tokenHash)).toEqual(kari)
      expect(await invitations.find(InvitationId.random())).toBeNull()
      expect(await invitations.byToken('other' as TokenHash)).toBeNull()
    })

    it("lists a company's invitations newest first, and no other company's", async () => {
      const invitations = await make()
      const old = invitation('2026-10-01T10:00:00.000Z')
      const recent = invitation('2026-10-29T10:00:00.000Z')
      await invitations.save(old)
      await invitations.save(recent)
      await invitations.save(
        invitation('2026-10-15T10:00:00.000Z', {
          company: CompanyUid.parse('globex'),
        }),
      )

      expect(await invitations.forCompany(acme)).toEqual([recent, old])
    })

    it('keeps who joined and when it was revoked', async () => {
      const invitations = await make()
      const at = Instant.parse('2026-10-30T10:00:00.000Z')
      const joined = invitation('2026-10-29T10:00:00.000Z', {
        redeemed: { by: UserUid.parse('kari'), at },
      })
      const revoked = invitation('2026-10-28T10:00:00.000Z', { revokedAt: at })
      await invitations.save(joined)
      await invitations.save(revoked)

      expect(await invitations.find(joined.id)).toEqual(joined)
      expect(await invitations.find(revoked.id)).toEqual(revoked)
    })
  })
}
