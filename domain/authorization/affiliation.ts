import {
  isEntitlement,
  type Entitlement,
} from '@/domain/authorization/entitlements'
import { isRelationship, type Relationship } from '@/domain/business/company'
import { TimeZone, Zone, type ISO8601String } from '@/domain/time'

/**
 * A company's current contract with E&T-dagene: its tier, and the entitlements it holds against
 * the tier's defaults
 *
 * @remarks
 * `true` adds an entitlement and `false` takes one away, as in {@link HasEntitlementOverrides}.
 * Résumé access is the override set most often, since it is sold separately.
 */
export interface Affiliation {
  tier: Relationship
  overrides: Partial<Record<Entitlement, boolean>>
  /** The tier the company had at the last fair, kept by the yearly reset until an admin sets a new one */
  formerTier?: Relationship
}

/**
 * Read an affiliation as the admin form sends it: `{ tier, overrides: { '<ent:…>': boolean } }`
 *
 * @remarks
 * Unknown tiers and entitlements are refused rather than dropped, so an admin never stores less
 * than they chose.
 */
export function checkedAffiliation(
  body: unknown,
): Affiliation | { problem: 'company/invalid-affiliation' } {
  const invalid = { problem: 'company/invalid-affiliation' } as const
  const { tier, overrides = {} } = (body ?? {}) as Record<string, unknown>
  if (!isRelationship(tier)) return invalid
  if (typeof overrides !== 'object' || overrides === null) return invalid

  const entries = Object.entries(overrides)
  if (
    !entries.every(([key, on]) => isEntitlement(key) && typeof on === 'boolean')
  )
    return invalid
  return { tier, overrides: Object.fromEntries(entries) }
}

const OSLO = TimeZone.parse('Europe/Oslo')

/**
 * From when, in the reset's year, an affiliation belongs to the next fair: 1 March, Oslo time
 *
 * @remarks
 * The yearly reset runs on 1 June (`nitro.scheduledTasks`), a few months after the February
 * fair, so companies keep résumé access while they recruit. Deals for the next fair are made
 * after the last one, so an affiliation an admin set from March on survives the reset; one set
 * before is the last fair's.
 */
export function nextFairFrom(now: ISO8601String): ISO8601String {
  const year = Zone.toInput(now, OSLO).slice(0, 4)
  return Zone.fromInput(`${year}-03-01T00:00`, OSLO)
}

/**
 * An affiliation after the yearly reset: a former company, without the exceptions it had
 *
 * @remarks
 * The overrides go too, since résumé access is usually one of them and must end with the tier.
 * Only a company that had a tier at the fair keeps it as `formerTier`, so the former tiers name
 * exactly the last fair's companies.
 */
export const afterTheFair = (affiliation: Affiliation): Affiliation => ({
  tier: 'prior',
  overrides: {},
  ...(affiliation.tier !== 'prior' && { formerTier: affiliation.tier }),
})

/** Whether the reset changes the affiliation; a former company with nothing extra it leaves be */
export const changesAtReset = ({ tier, overrides, formerTier }: Affiliation) =>
  tier !== 'prior' ||
  Object.keys(overrides).length > 0 ||
  formerTier !== undefined
