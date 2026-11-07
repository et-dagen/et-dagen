import type { Relationship } from '@/domain/business/company'
import type { ListedCompany } from '@/lib/companies'

/** A company on the landing page */
export type Company = ListedCompany

export interface Lineup {
  mainPartner: Company | null
  partners: Company[]
  sponsors: Company[]
  /** The companies are the last fair's: no company has a tier for the next one yet */
  last: boolean
}

const byName = (a: Company, b: Company) =>
  (a.name ?? '').localeCompare(b.name ?? '', 'nb')

/**
 * Who comes this year, by tier, or who came last year until this year's companies are set
 *
 * @remarks
 * Only companies with a logo are shown: the landing page sets companies as logo plates, and an
 * empty plate reads as a fault. Former companies (`prior`) are left out, except that after the
 * yearly reset, when no company has a tier, the last fair's companies show by the tier they had.
 * Each tier is sorted by name, unless `order` is `'stored'`, which keeps the order the
 * companies were given in.
 */
export function lineupOf(
  companies: Record<string, Company> | null | undefined,
  { order = 'name' }: { order?: 'name' | 'stored' } = {},
): Lineup {
  const shown = Object.values(companies ?? {}).filter((c) => !!c.logo)
  const by = (
    tierOf: (c: Company) => Relationship | undefined,
    last: boolean,
  ) => {
    const tier = (name: Relationship) => {
      const listed = shown.filter((c) => tierOf(c) === name)
      return order === 'name' ? listed.sort(byName) : listed
    }
    return {
      mainPartner: tier('mainPartner')[0] ?? null,
      partners: tier('partner'),
      sponsors: tier('sponsor'),
      last,
    }
  }
  const current = by((c) => c.tier, false)
  const empty =
    !current.mainPartner && !current.partners.length && !current.sponsors.length
  return empty ? by((c) => c.formerTier, true) : current
}
