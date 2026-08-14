import type { HasDescription, HasLogo, HasWebpage } from '@/domain/traits'
import { opaqueUid, type Brand } from '@/domain/brand'

/** Different company tiers */
export type Relationship = 'mainPartner' | 'partner' | 'sponsor' | 'prior'

/**
 * Identifies a company
 *
 * @remarks
 * Application-minted, unlike {@link UserUid} — nothing outside this codebase decides what a company
 * uid looks like. Today it is a Realtime Database push key; under a relational store it would be
 * whatever that store's primary key is. The brand names the *concept*, never the encoding, so a
 * change of storage reaches the repository mapper and stops there. That is why {@link parse}
 * checks only that the value is non-empty: adding a push-key or UUID pattern here would bake
 * today's database into the domain and undo exactly the insulation the brand exists to give.
 *
 * Distinct from {@link UserUid} so the two can never be passed to each other's parameters. `Job`
 * carries both a `uid` and a `companyUid`, which is precisely the mix-up the brands prevent.
 */
export type CompanyUid = Brand<string, 'CompanyUid'>

export const CompanyUid = opaqueUid<CompanyUid>('Company uid')

/**
 * A company connected to E&T-dagene
 */
export interface Company {
  uid: CompanyUid
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
