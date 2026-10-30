/**
 * What every adapter of {@link AffiliationRepository} must do
 *
 * An adapter's test file calls {@link describeAffiliationRepository} with a factory that returns
 * the store and a probe, because the port itself cannot read back.
 */
import { describe, expect, it } from 'vitest'
import type { AffiliationRepository } from '@/application/companies/affiliationRepository'
import type { Affiliation } from '@/domain/authorization/affiliation'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'

const [acme, globex] = ['acme', 'globex'].map(CompanyUid.parse)
const stamp = {
  at: Instant.parse('2026-10-26T12:00:00.000Z'),
  by: UserUid.parse('admin'),
}

export interface Probed {
  store: AffiliationRepository
  held(company: CompanyUid): Promise<Affiliation | null>
}

export function describeAffiliationRepository(
  adapter: string,
  make: () => Promise<Probed> | Probed,
) {
  describe(`${adapter} affiliations`, () => {
    it('stores an affiliation in place of the one before', async () => {
      const { store, held } = await make()
      await store.set(acme, { tier: 'partner', overrides: {} }, stamp)
      await store.set(
        acme,
        { tier: 'sponsor', overrides: { 'ent:resume:view': true } },
        stamp,
      )

      expect(await held(acme)).toEqual({
        tier: 'sponsor',
        overrides: { 'ent:resume:view': true },
      })
    })

    it('lists every affiliation with when it was set', async () => {
      const { store } = await make()
      await store.set(acme, { tier: 'partner', overrides: {} }, stamp)
      await store.set(
        globex,
        { tier: 'prior', overrides: {}, formerTier: 'sponsor' },
        stamp,
      )

      expect(
        (await store.all()).sort((a, b) => a.company.localeCompare(b.company)),
      ).toEqual([
        {
          company: acme,
          affiliation: { tier: 'partner', overrides: {} },
          setAt: stamp.at,
        },
        {
          company: globex,
          affiliation: { tier: 'prior', overrides: {}, formerTier: 'sponsor' },
          setAt: stamp.at,
        },
      ])
    })

    it('removes the given companies and keeps the rest', async () => {
      const { store, held } = await make()
      await store.set(acme, { tier: 'partner', overrides: {} }, stamp)
      await store.set(globex, { tier: 'partner', overrides: {} }, stamp)
      await store.remove([acme, CompanyUid.parse('gone')])
      await store.remove([])

      expect(await held(acme)).toBeNull()
      expect(await held(globex)).toEqual({ tier: 'partner', overrides: {} })
    })
  })
}
