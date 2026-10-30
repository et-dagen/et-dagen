import { describe, expect, it } from 'vitest'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { Instant } from '@/domain/time'
import { visibleUsers } from '@/server/utils/userVisibility'
import { subjectOf } from '@/tests/server/api/support/subject'

const person = (uid: string, extra: Record<string, unknown> = {}) => ({
  uid,
  name: `Name ${uid}`,
  email: `${uid}@example.com`,
  studyProgram: 'MTEL',
  currentYear: 3,
  dietaryRestrictions: ['gluten'],
  userType: 'basic',
  ...extra,
})

const users = [
  person('me'),
  person('attending'),
  person('queued'),
  person('elsewhere'),
  person('with-resume', { resume: 'https://storage.googleapis.com/b/cv.pdf' }),
  person('rep', { userType: 'company', companyUID: 'ours' }),
]

const events = {
  ours: {
    companyUID: 'ours',
    attendants: { attending: { attended: false } },
    queue: { 1: 'queued' },
  },
  theirs: { companyUID: 'theirs', attendants: { elsewhere: {} } },
}

const env = { now: Instant.parse('2026-10-26T12:00:00.000Z') }
const partner = (cvAccess: boolean) => ({
  ours: { name: 'Ours', type: 'partner', cvAccess },
})

const uids = (list: Record<string, unknown>[]) => list.map((u) => u.uid)

describe('visibleUsers for a student', () => {
  const visible = visibleUsers(
    subjectOf({ uid: 'me', userType: 'basic' }),
    users,
    events,
    env,
  )

  it('lists themselves and event attendants only', () => {
    expect(uids(visible)).toEqual(['me', 'attending', 'elsewhere'])
  })

  it('shows only the name and study programme of others', () => {
    expect(visible[1]).toEqual({
      uid: 'attending',
      name: 'Name attending',
      studyProgram: 'MTEL',
    })
  })

  it('keeps their own record whole', () => {
    expect(visible[0]).toEqual(users[0])
  })
})

describe('visibleUsers for a company', () => {
  const rep = { uid: 'rep', userType: 'company', companyUID: 'ours' }
  const viewer = subjectOf(rep, partner(false))

  it('lists the attendants and queue of its own events only', () => {
    expect(uids(visibleUsers(viewer, users, events, env))).toEqual([
      'attending',
      'queued',
    ])
  })

  it('gets dietary needs only as counts, never per person', () => {
    for (const u of visibleUsers(viewer, users, events, env)) {
      expect(u).not.toHaveProperty('dietaryRestrictions')
    }
  })

  it('never includes résumé links without résumé access', () => {
    const withAttendingResume = users.map((u) =>
      u.uid === 'attending' ? { ...u, resume: 'link' } : u,
    )
    for (const u of visibleUsers(viewer, withAttendingResume, events, env)) {
      expect(u).not.toHaveProperty('resume')
      expect(u).not.toHaveProperty('userType')
    }
  })

  it('adds everyone with a résumé when it has résumé access', () => {
    const visible = visibleUsers(
      subjectOf(rep, partner(true)),
      users,
      events,
      env,
    )
    expect(uids(visible)).toEqual(['attending', 'queued', 'with-resume'])
    expect(visible[2]).toHaveProperty('resume')
  })
})

describe('visibleUsers for a coordinator', () => {
  const viewer = {
    ...subjectOf(person('me')),
    roles: ['user', 'coordinator'] as const,
    companies: new Map([
      [CompanyUid.parse('ours'), new Set(['ent:event:manage'] as const)],
    ]),
  } as unknown as Subject

  it('sees the people on the events they manage as a company does, and themselves', () => {
    const visible = visibleUsers(viewer, users, events, env)

    expect(uids(visible)).toEqual(['me', 'attending', 'queued', 'elsewhere'])
    expect(visible.find((u) => u.uid === 'queued')).toHaveProperty('email')
    expect(visible.find((u) => u.uid === 'elsewhere')).not.toHaveProperty(
      'email',
    )
    expect(visible.some((u) => 'resume' in u)).toBe(false)
  })

  it('sees what each person on their events needs to eat, to order the food', () => {
    const visible = visibleUsers(viewer, users, events, env)

    expect(visible.find((u) => u.uid === 'attending')).toHaveProperty(
      'dietaryRestrictions',
      ['gluten'],
    )
    expect(visible.find((u) => u.uid === 'elsewhere')).not.toHaveProperty(
      'dietaryRestrictions',
    )
  })
})

describe('visibleUsers for others', () => {
  it('shows everyone in full to an admin', () => {
    const admin = subjectOf({ uid: 'boss', userType: 'admin' })
    expect(visibleUsers(admin, users, events, env)).toEqual(users)
  })

  it('shows a sponsor the people on its own events, as any company', () => {
    const rep = { uid: 'rep', userType: 'company', companyUID: 'ours' }
    const sponsor = subjectOf(rep, {
      ours: { name: 'Ours', type: 'sponsor', cvAccess: false },
    })
    expect(uids(visibleUsers(sponsor, users, events, env))).toEqual([
      'attending',
      'queued',
    ])
  })
})
