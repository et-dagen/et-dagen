import {
  isEntitlement,
  type Entitlement,
} from '@/domain/authorization/entitlements'
import { isRelationship, type Relationship } from '@/domain/business/company'

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
