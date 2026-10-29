import { z } from 'zod'
import { RELATIONSHIPS, type Relationship } from '@/domain/business/company'

/** The tiers, from the most visible down to former companies */
export const COMPANY_TIERS = RELATIONSHIPS

/** The key of each tier's translations under `admin.companies.type`, kept from v1's `type` */
export const TYPE_OF_TIER: Record<Relationship, string> = {
  mainPartner: 'main-partner',
  partner: 'partner',
  sponsor: 'sponsor',
  prior: 'old',
}

const required = z.string({ error: 'required' }).trim().min(1, 'required')

/**
 * A company as the admin form sends it, without the logo, which is uploaded on its own
 *
 * @remarks
 * Messages are keys under `form.errors`. Only `http(s)` addresses pass, so a stored link can
 * never run script. Résumé access is sold apart from the tier, so it is set on its own.
 */
export const CompanyInput = z.object({
  name: required.max(100, 'too_long'),
  tier: z.enum(COMPANY_TIERS, { error: 'required' }),
  webpage: required.refine((url) => /^https?:\/\/\S+$/.test(url), 'url'),
  description: z.string().trim().max(2000, 'too_long').default(''),
  resumeAccess: z.boolean().default(false),
})

export type CompanyInput = z.infer<typeof CompanyInput>

/** What a company's own users and coordinators may change: the profile students see */
export const CompanyProfile = CompanyInput.pick({
  name: true,
  webpage: true,
  description: true,
})

export type CompanyProfile = z.infer<typeof CompanyProfile>

/** The two bodies the form sends: the profile for `/company`, the contract for `/company/affiliation` */
export function toV1Company({ tier, resumeAccess, ...profile }: CompanyInput) {
  return {
    profile,
    affiliation: { tier, overrides: { 'ent:resume:view': resumeAccess } },
  }
}
