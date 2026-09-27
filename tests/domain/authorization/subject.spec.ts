import { describe, expect, it } from 'vitest'
import type { Entitlement } from '~/domain/authorization/entitlements'
import {
  deserializeSubject,
  serializeSubject,
  type Subject,
} from '~/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { admits, type Registration } from '~/domain/event/registration'
import { Term } from '@/domain/ntnu'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'

const co = CompanyUid.parse

const coordinator: Subject = {
  uid: UserUid.parse('u1'),
  roles: ['coordinator', 'user'],
  companies: new Map<CompanyUid, ReadonlySet<Entitlement>>([
    [co('a'), new Set(['ent:job:manage', 'ent:event:manage'])],
    [co('b'), new Set(['ent:resume:view'])],
  ]),
  applicant: {
    programme: 'mtdt',
    year: 4,
    graduation: Term.parse('2028-spring'),
  },
}

const student: Subject = {
  uid: UserUid.parse('u2'),
  roles: ['user'],
  companies: new Map(),
  applicant: null,
}

describe('round trip', () => {
  it('rebuilds the entitlement map entry for entry', () => {
    const rebuilt = deserializeSubject(serializeSubject(coordinator))

    expect(rebuilt).toEqual(coordinator)
    expect([...(rebuilt.companies.get(co('a')) ?? [])].sort()).toEqual([
      'ent:event:manage',
      'ent:job:manage',
    ])
  })

  it('rebuilds an empty Map, not undefined, for a subject with no companies', () => {
    const rebuilt = deserializeSubject(serializeSubject(student))

    expect(rebuilt.companies).toBeInstanceOf(Map)
    expect(rebuilt.companies.size).toBe(0)
    expect(rebuilt.applicant).toBeNull()
  })

  it('survives JSON, which is the payload path the wire shape exists for', () => {
    const wire = JSON.parse(JSON.stringify(serializeSubject(coordinator)))

    expect(deserializeSubject(wire)).toEqual(coordinator)
  })

  it('refuses an applicant whose year or term does not parse', () => {
    const wire = serializeSubject(coordinator)
    const applicant = wire.applicant!

    expect(() =>
      deserializeSubject({ ...wire, applicant: { ...applicant, year: 6 } }),
    ).toThrow(RangeError)
    expect(() =>
      deserializeSubject({
        ...wire,
        applicant: { ...applicant, graduation: '2028' },
      }),
    ).toThrow(RangeError)
  })
})

describe('as an applicant', () => {
  const restricted: Registration = {
    period: {
      start: Instant.parse('2026-08-01T10:00:00.000Z'),
      duration: Duration.fromDays(14),
    },
    attendanceLimit: null,
    eligibility: { kind: 'programme', programmes: ['mtdt'] },
  }

  it('is judged by an eligibility rule through its applicant', () => {
    expect(admits(restricted, coordinator.applicant)).toEqual({ ok: true })
    expect(admits(restricted, student.applicant)).toEqual({
      ok: false,
      reason: 'notEnrolled',
    })
  })
})
