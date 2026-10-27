/** A company as `GET /api/v1/company` returns it to the landing page */
export interface Company {
  name?: string
  logo?: string
  webpage?: string
  description?: string
  tier?: 'mainPartner' | 'partner' | 'sponsor' | 'prior'
}

export interface Lineup {
  mainPartner: Company | null
  partners: Company[]
  sponsors: Company[]
}

const byName = (a: Company, b: Company) =>
  (a.name ?? '').localeCompare(b.name ?? '', 'nb')

/**
 * Who comes this year, by tier
 *
 * @remarks
 * Only companies with a logo are shown: the landing page sets companies as logo plates, and an
 * empty plate reads as a fault. Former companies (`prior`) are left out.
 */
export function lineupOf(
  companies: Record<string, Company> | null | undefined,
): Lineup {
  const shown = Object.values(companies ?? {}).filter((c) => !!c.logo)
  const tier = (name: Company['tier']) =>
    shown.filter((c) => c.tier === name).sort(byName)
  return {
    mainPartner: tier('mainPartner')[0] ?? null,
    partners: tier('partner'),
    sponsors: tier('sponsor'),
  }
}
