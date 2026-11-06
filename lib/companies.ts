import type { Relationship } from '@/domain/business/company'

/** A company as `GET /api/v1/company` lists it; every field may be missing from old records */
export interface ListedCompany {
  name?: string
  logo?: string | null
  webpage?: string | null
  description?: string
  tier?: Relationship
  /** The tier at the last fair, once the yearly reset has made the company former */
  formerTier?: Relationship
  /** What the tier and its overrides grant; only admins get it */
  entitlements?: string[]
}

/** The companies keyed by uid, as the endpoint returns them; null when there are none */
export type ListedCompanies = Record<string, ListedCompany> | null

/** A company's name, or an empty string for an unknown uid */
export const companyName = (
  companies: ListedCompanies | undefined,
  uid: string | null | undefined,
): string => companies?.[uid ?? '']?.name ?? ''
