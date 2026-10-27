import type { Entitlement } from '@/domain/authorization/entitlements'
import type { Subject } from '@/domain/authorization/subject'
import type { CompanyUid } from '@/domain/business/company'

/**
 * Attached to this company, and that company is entitled
 *
 * @remarks
 * Ownership and entitlement in one test. A company user is the one-entry case of a coordinator, so
 * this single predicate serves both roles and a separate `owns` helper never needs to exist.
 */
export const can = (
  subject: Subject,
  companyUid: CompanyUid,
  entitlement: Entitlement,
): boolean => subject.companies.get(companyUid)?.has(entitlement) ?? false

/**
 * Attached to this company, whatever it is entitled to
 *
 * @remarks
 * For work E&T-dagene does for a company rather than something the company buys, such as taking
 * attendance at its events.
 */
export const actsFor = (subject: Subject, companyUid: CompanyUid): boolean =>
  subject.companies.has(companyUid)

/**
 * Any associated company carries the entitlement
 *
 * @remarks
 * For actions that name no single company, such as reading the full resume list.
 */
export const canAny = (subject: Subject, entitlement: Entitlement): boolean =>
  [...subject.companies.values()].some((granted) => granted.has(entitlement))
