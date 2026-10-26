import { describe, expect, it } from 'vitest'
import { CompanyUid } from '@/domain/business/company'
import { AREAS, type Area } from '@/lib/auth/areas'
import { askerFor } from '@/lib/auth/asker'
import { subjectOf } from '@/tests/server/api/support/subject'

const companies = {
  partner: { name: 'Partner', type: 'partner', cvAccess: true },
  sponsor: { name: 'Sponsor', type: 'sponsor', cvAccess: false },
  reader: { name: 'Reader', type: 'sponsor', cvAccess: true },
}
const contact = (companyUID: string) =>
  askerFor(
    subjectOf({ uid: 'rep', userType: 'company', companyUID }, companies),
  )
const areasOf = (asker: ReturnType<typeof askerFor>) =>
  (Object.keys(AREAS) as Area[]).filter((area) => AREAS[area](asker))

describe('areas', () => {
  it('opens everything to an admin', () => {
    expect(
      areasOf(askerFor(subjectOf({ uid: 'boss', userType: 'admin' }))),
    ).toEqual(['admin', 'events', 'jobs', 'company'])
  })

  it("opens a partner's contact the company pages, not the admin panel", () => {
    expect(areasOf(contact('partner'))).toEqual(['events', 'jobs', 'company'])
  })

  it('opens the company pages to a sponsor only with résumé access', () => {
    expect(areasOf(contact('sponsor'))).toEqual([])
    expect(areasOf(contact('reader'))).toEqual(['company'])
  })

  it('opens nothing to a student or to nobody', () => {
    const student = subjectOf({
      uid: 'me',
      userType: 'basic',
      studyProgram: 'MTEL',
      currentYear: 3,
    })
    expect(areasOf(askerFor(student))).toEqual([])
    expect(areasOf(askerFor(null))).toEqual([])
  })
})

describe('askerFor', () => {
  it("answers for one company's events, as the server would", () => {
    const asker = contact('partner')
    const event = (uid: string) => ({ companyUid: CompanyUid.parse(uid) })

    expect(asker.can('event', 'update', event('partner'))).toBe(true)
    expect(asker.can('event', 'update', event('sponsor'))).toBe(false)
    expect(asker.canForSome('event', 'update')).toBe(true)
  })
})
