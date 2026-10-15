import type { Company, Relationship } from '@/domain/business/company'

/**
 * A capability a company holds, which its users inherit
 *
 * @remarks
 * Spelled `ent:<resource>:<action>` so an entitlement never reads like a permission — which the
 * role table also writes `<resource>:<action>`. No `own` segment appears, because an entitlement is
 * always scoped to the company holding it; who is attached to that company is a separate question,
 * answered by {@link can}.
 *
 * These strings are Realtime Database keys under `entitlementOverrides`. Firebase rejects only `.`,
 * `$`, `#`, `[`, `]`, `/` and control characters, so colons are legal — but they force quoting in
 * TypeScript object literals, which camelCase names did not.
 */
export type Entitlement =
  | 'ent:resume:view' // today's cvAccess
  | 'ent:job:manage'
  | 'ent:event:manage'
  | 'ent:profile:manage' // only own profile

/**
 * Capability of overriding the entitlements a relationship implies
 *
 * @remarks
 * A trait rather than a field on {@link Company}, so `domain/business` carries no authorization
 * vocabulary and the entity is not widened for a single consumer. `true` adds an entitlement,
 * `false` removes one, and an absent key falls through to the relationship defaults.
 */
export interface HasEntitlementOverrides {
  entitlementOverrides: Partial<Record<Entitlement, boolean>>
}

/**
 * A company as the authorization layer reads it
 */
export type EntitledCompany = Company & HasEntitlementOverrides

/**
 * What each contract tier grants before any override is applied
 *
 * @remarks
 * `ent:resume:view` is inert until the company data is migrated: the repository mapper emits an
 * explicit override in both directions from `cvAccess`, so no company's resume access changes on
 * deploy.
 */
const defaults: Record<Relationship, readonly Entitlement[]> = {
  mainPartner: [
    'ent:resume:view',
    'ent:job:manage',
    'ent:event:manage',
    'ent:profile:manage',
  ],
  partner: [
    'ent:resume:view',
    'ent:job:manage',
    'ent:event:manage',
    'ent:profile:manage',
  ],
  sponsor: [],
  prior: [],
}

/**
 * Resolve what a company is entitled to
 *
 * @remarks
 * Takes the structural minimum rather than a whole {@link Company}, so a plain domain company and
 * an {@link EntitledCompany} from the repository mapper are both accepted.
 */
export const entitlementsFor = (
  company: Pick<Company, 'relationship'> & Partial<HasEntitlementOverrides>,
): ReadonlySet<Entitlement> => {
  const granted = new Set<Entitlement>(defaults[company.relationship])

  const overrides = Object.entries(company.entitlementOverrides ?? {}) as [
    Entitlement,
    boolean,
  ][]

  for (const [entitlement, enabled] of overrides) {
    if (enabled) granted.add(entitlement)
    else granted.delete(entitlement)
  }

  return granted
}
