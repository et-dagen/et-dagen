import { describe, expect, it } from 'vitest'
import { setAffiliation } from '@/application/companies/affiliation'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryAffiliationRepository } from '@/server/adapters/memory/affiliationRepository'
import { memoryCompanyRepository } from '@/server/adapters/memory/companyRepository'

const acme = CompanyUid.parse('acme')
const now = Instant.parse('2026-10-26T12:00:00.000Z')
const subject = (role: Role): Subject => ({
  uid: UserUid.parse(`${role}-1`),
  roles: [role],
  companies: new Map([[acme, new Set(['ent:profile:manage'] as const)]]),
  applicant: null,
})
const sponsorWithResumes = {
  tier: 'sponsor',
  overrides: { 'ent:resume:view': true },
} as const

const setup = () => {
  const affiliations = memoryAffiliationRepository()
  const companies = memoryCompanyRepository([
    {
      uid: acme,
      name: 'Acme',
      relationship: 'partner',
      entitlementOverrides: {},
    },
  ])
  return { affiliations, deps: { affiliations, companies } }
}

describe('setAffiliation', () => {
  it('lets an admin set the tier and résumé access', async () => {
    const { affiliations, deps } = setup()
    await setAffiliation(deps, {
      subject: subject('admin'),
      company: acme,
      affiliation: sponsorWithResumes,
      now,
    })
    expect(affiliations.read(acme)).toEqual(sponsorWithResumes)
  })

  it("refuses the company's own users and coordinators", async () => {
    const { affiliations, deps } = setup()
    for (const role of ['company', 'coordinator', 'user'] as const) {
      await expect(
        setAffiliation(deps, {
          subject: subject(role),
          company: acme,
          affiliation: sponsorWithResumes,
          now,
        }),
      ).rejects.toMatchObject({ code: 'auth/forbidden' })
    }
    expect(affiliations.read(acme)).toBeUndefined()
  })

  it('refuses a company that does not exist', async () => {
    const { deps } = setup()
    await expect(
      setAffiliation(deps, {
        subject: subject('admin'),
        company: CompanyUid.parse('gone'),
        affiliation: sponsorWithResumes,
        now,
      }),
    ).rejects.toMatchObject({ code: 'company/not-found' })
  })
})
