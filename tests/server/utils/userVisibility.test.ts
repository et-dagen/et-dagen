import { describe, expect, it } from 'vitest'
import { visibleUsers } from '@/server/utils/userVisibility'

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

const uids = (list: Record<string, unknown>[]) => list.map((u) => u.uid)

describe('visibleUsers for a student', () => {
  const visible = visibleUsers(
    { uid: 'me', userType: 'basic' },
    users,
    events,
    false,
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
  const viewer = { uid: 'rep', userType: 'company', companyUID: 'ours' }

  it('lists the attendants and queue of its own events only', () => {
    expect(uids(visibleUsers(viewer, users, events, false))).toEqual([
      'attending',
      'queued',
    ])
  })

  it('never includes résumé links without résumé access', () => {
    const withAttendingResume = users.map((u) =>
      u.uid === 'attending' ? { ...u, resume: 'link' } : u,
    )
    for (const u of visibleUsers(viewer, withAttendingResume, events, false)) {
      expect(u).not.toHaveProperty('resume')
      expect(u).not.toHaveProperty('userType')
    }
  })

  it('adds everyone with a résumé when it has résumé access', () => {
    const visible = visibleUsers(viewer, users, events, true)
    expect(uids(visible)).toEqual(['attending', 'queued', 'with-resume'])
    expect(visible[2]).toHaveProperty('resume')
  })
})
