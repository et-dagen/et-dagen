/**
 * What every {@link CompanyRepository} adapter must do
 *
 * An adapter's test file calls {@link describeCompanyRepository} with a factory that seeds the
 * store, so the suite runs once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type { CompanyRepository } from '@/application/companies/companyRepository'
import type { EntitledCompany } from '@/domain/authorization/entitlements'
import { CompanyUid } from '@/domain/business/company'

const [acme, bolt, gone] = ['acme', 'bolt', 'gone'].map(CompanyUid.parse)

export const SEED: EntitledCompany[] = [
  {
    uid: acme,
    name: 'Acme',
    relationship: 'mainPartner',
    entitlementOverrides: { 'ent:resume:view': false },
  },
  {
    uid: bolt,
    name: 'Bolt',
    relationship: 'sponsor',
    entitlementOverrides: { 'ent:resume:view': true },
  },
]

export function describeCompanyRepository(
  adapter: string,
  make: (seed: EntitledCompany[]) => Promise<CompanyRepository>,
) {
  describe(`${adapter} CompanyRepository`, () => {
    it('reads each asked company with its tier and overrides', async () => {
      const companies = await make(SEED)
      const found = await companies.entitled([bolt, acme])
      expect(found).toHaveLength(2)
      expect(found).toEqual(expect.arrayContaining(SEED))
    })

    it('reads every stored company', async () => {
      const companies = await make(SEED)
      const found = await companies.all()
      expect(found).toHaveLength(2)
      expect(found).toEqual(expect.arrayContaining(SEED))
    })

    it('skips companies that are not stored', async () => {
      const companies = await make(SEED)
      expect(await companies.entitled([gone, acme])).toEqual([SEED[0]])
      expect(await companies.entitled([])).toEqual([])
    })

    it('stores and reads a logo link', async () => {
      const companies = await make(SEED)
      expect(await companies.logoOf(bolt)).toBeNull()
      await companies.setLogo(bolt, 'https://example.com/bolt.webp')
      expect(await companies.logoOf(bolt)).toBe('https://example.com/bolt.webp')
    })
  })
}
