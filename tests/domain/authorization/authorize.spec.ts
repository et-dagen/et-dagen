import { describe, expect, it } from 'vitest'
import { CompanyUid } from '@/domain/business/company'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import { Term } from '@/domain/ntnu'
import { Duration } from '@/domain/time/duration'
import type { ISO8601String } from '@/domain/time'
import { Instant } from '@/domain/time/instant'
import { UserUid, type Role } from '@/domain/user'

const subjectOf = (role: Role): Subject => ({
  uid: UserUid.parse('self'),
  roles: [role],
  companies: new Map(),
  applicant:
    role === 'user'
      ? { programme: 'mtdt', year: 4, graduation: Term.parse('2028-spring') }
      : null,
})

const opens = Instant.parse('2026-08-01T10:00:00.000Z')
const target = {
  targetUserUid: UserUid.parse('self'),
  event: {
    companyUid: CompanyUid.parse('host'),
    registration: {
      period: { start: opens, duration: Duration.fromDays(14) },
      attendanceLimit: null,
    },
  },
}
const now = { now: opens }

describe('authorize', () => {
  it('answers 401 when nobody is asking', () => {
    for (const nobody of [null, undefined]) {
      expect(() =>
        authorize(nobody, 'board', 'manage', undefined, now),
      ).toThrow(expect.objectContaining({ code: 'auth/signed-out' }))
    }
  })

  it('answers 403 when the table denies', () => {
    expect(() =>
      authorize(subjectOf('user'), 'board', 'manage', undefined, now),
    ).toThrow(expect.objectContaining({ code: 'auth/forbidden' }))
  })

  it('returns when the table allows', () => {
    expect(() =>
      authorize(subjectOf('admin'), 'board', 'manage', undefined, now),
    ).not.toThrow()
  })

  it('decides with the clock it is given, not the wall clock', () => {
    const student = subjectOf('user')
    const create = (at: ISO8601String) =>
      authorize(student, 'registration', 'create', target, { now: at })
    const during = Instant.parse('2026-08-05T10:00:00.000Z')
    const before = Instant.parse('2026-07-31T10:00:00.000Z')

    expect(() => create(during)).not.toThrow()
    expect(() => create(before)).toThrow(
      expect.objectContaining({ code: 'auth/forbidden' }),
    )
  })
})
