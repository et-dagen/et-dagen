/** A company as `GET /api/v1/company` returns it to the landing page */
export interface Company {
  name?: string
  logo?: string
  webpage?: string
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

/**
 * Empty cells that close a logo wall's last row
 *
 * @remarks
 * The wall draws its grid lines through the gaps between cells, so a short last row would leave
 * a hole of bare line colour. `taken` counts cells, with the main partner's tile as several.
 */
export function fillerCount(taken: number, columns: number): number {
  return (columns - (taken % columns)) % columns
}
