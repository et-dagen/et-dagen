/** A company as `GET /api/v1/company` returns it to the landing page */
type Tier = 'mainPartner' | 'partner' | 'sponsor' | 'prior'

export interface Company {
  name?: string
  logo?: string
  webpage?: string
  tier?: Tier
  /** The tier at the last fair, once the yearly reset has made the company former */
  formerTier?: Tier
}

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
 */
export function lineupOf(
  companies: Record<string, Company> | null | undefined,
): Lineup {
  const shown = Object.values(companies ?? {}).filter((c) => !!c.logo)
  const by = (tierOf: (c: Company) => Tier | undefined, last: boolean) => {
    const tier = (name: Tier) =>
      shown.filter((c) => tierOf(c) === name).sort(byName)
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
