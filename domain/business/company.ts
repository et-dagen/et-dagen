import type { HasDescription, HasLogo, HasWebpage } from '@/domain/traits'

/** Different company tiers */
export type Relationship = 'mainPartner' | 'partner' | 'sponsor' | 'prior'

/**
 * A company connected to E&T-dagene
 */
export interface Company {
  uid: string
  name: string
  relationship: Relationship
}

/**
 * Company with descriptive details
 */
export type CompanyWithDescription = Company & HasDescription

/**
 * Company with a webpage to link to from E&T-dagene
 */
export type CompanyWithWebpage = Company & HasWebpage

/**
 * Company with a logo to display on the front page
 *
 * @remark
 * Most companies should logically have a logo,
 * but that may not be the case
 */
export type CompanyWithLogo = Company & HasLogo

/**
 * Everything the front page and the company profile need at once
 *
 * @remarks
 * Expressible only because the capabilities are named separately from the entity. Under the
 * previous shape this needed a fourth interface, and every further combination needed another.
 */
export type ListedCompany = Company & HasDescription & HasWebpage & HasLogo
