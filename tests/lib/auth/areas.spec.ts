import { describe, expect, it } from 'vitest'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { UserUid } from '@/domain/user'
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
    ).toEqual(['admin', 'events', 'jobs', 'profile', 'resumes', 'company'])
  })

  it("opens a partner's contact the company pages, but not event editing", () => {
    expect(areasOf(contact('partner'))).toEqual([
      'jobs',
      'profile',
      'resumes',
      'company',
    ])
  })

  it("opens a sponsor's contact its profile, and résumés when bought", () => {
    expect(areasOf(contact('sponsor'))).toEqual(['profile', 'company'])
    expect(areasOf(contact('reader'))).toEqual([
      'profile',
      'resumes',
      'company',
    ])
  })

  it("opens a sponsor's coordinator its events, every job and its profile", () => {
    const coordinator: Subject = {
      uid: UserUid.parse('volunteer'),
      roles: ['coordinator'],
      applicant: null,
      companies: new Map([
        [CompanyUid.parse('sponsor'), new Set(['ent:profile:manage'] as const)],
      ]),
    }
    expect(areasOf(askerFor(coordinator))).toEqual([
      'events',
      'jobs',
      'profile',
      'company',
    ])
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
  it("answers for one company's jobs and events, as the server would", () => {
    const asker = contact('partner')
    const event = (uid: string) => ({ companyUid: CompanyUid.parse(uid) })

    expect(asker.can('job', 'update', event('partner'))).toBe(true)
    expect(asker.can('job', 'update', event('sponsor'))).toBe(false)
    expect(asker.canForSome('job', 'update')).toBe(true)
    expect(asker.canForSome('event', 'update')).toBe(false)
    expect(asker.canForSome('event', 'list')).toBe(true)
    expect(asker.canForSome('company', 'update')).toBe(true)
  })
})
