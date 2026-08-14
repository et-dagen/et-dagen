import { describe, expect, it } from 'vitest'
import type { Entitlement } from '~/domain/authorization/entitlements'
import { hasPermission } from '~/domain/authorization/hasPermission'
import type { Environment } from '~/domain/authorization/permissions'
import type { Subject } from '~/domain/authorization/subject'
import type { HasRegistration } from '~/domain/event/event'
import type { EligibilityRule } from '~/domain/authorization/eligibility'
import { CompanyUid } from '@/domain/business/company'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'
import { UserUid, type Role } from '@/domain/user'

// Fixtures name uids as plain strings and brand them here, so the specs read as data rather than
// as a string of parse calls. `co` is the same for the company uids the permission table takes.
const co = CompanyUid.parse

const subjectOf = (subject: {
  roles: Role[]
  companies?: Record<string, Entitlement[]>
  programme?: string
  year?: number | string
  uid?: string
}): Subject => ({
  uid: UserUid.parse(subject.uid ?? 'self'),
  roles: subject.roles,
  companies: new Map(
    Object.entries(subject.companies ?? {}).map(([uid, entitlements]) => [
      co(uid),
      new Set(entitlements),
    ]),
  ),
  programme: subject.programme,
  year: subject.year,
})

const opens = Instant.parse('2026-08-01T10:00:00.000Z')
const before = Instant.parse('2026-07-31T10:00:00.000Z')
const during = Instant.parse('2026-08-05T10:00:00.000Z')
const closes = Instant.parse('2026-08-15T10:00:00.000Z') // exactly endOf(period)

const at = (now: typeof opens): Environment => ({ now })

const eventWith = (eligibility?: EligibilityRule): HasRegistration => ({
  registration: {
    period: { start: opens, duration: Duration.fromDays(14) },
    attendanceLimit: null,
    eligibility,
  },
})

const admin = subjectOf({ roles: ['admin'] })
const student = subjectOf({ roles: ['user'], programme: 'mtdt', year: 4 })

describe('default deny', () => {
  it('denies an absent subject', () => {
    expect(hasPermission(null, 'code', 'read')).toBe(false)
    expect(hasPermission(undefined, 'code', 'read')).toBe(false)
  })

  it('denies a resource and action with no leaf', () => {
    expect(hasPermission(student, 'code', 'create')).toBe(false)
    expect(hasPermission(student, 'company', 'delete', { uid: co('a') })).toBe(
      false,
    )
  })

  it('denies a predicate leaf invoked without data', () => {
    expect(hasPermission(student, 'user', 'update')).toBe(false)
  })
})

describe('boolean leaves', () => {
  it('grants admin the resources that carry no data', () => {
    expect(hasPermission(admin, 'code', 'create')).toBe(true)
    expect(hasPermission(admin, 'image', 'upload')).toBe(true)
  })

  it('denies every other role', () => {
    for (const roles of [['user'], ['company'], ['coordinator']] as Role[][]) {
      expect(hasPermission(subjectOf({ roles }), 'code', 'create')).toBe(false)
      expect(hasPermission(subjectOf({ roles }), 'image', 'upload')).toBe(false)
    }
  })
})

describe('multi-role union', () => {
  const both = subjectOf({ roles: ['user', 'admin'] })

  it('permits everything admin is permitted', () => {
    expect(hasPermission(both, 'company', 'delete', { uid: co('a') })).toBe(
      true,
    )
    expect(hasPermission(both, 'code', 'delete')).toBe(true)
  })
})

describe('per-company entitlements', () => {
  // The case a flat, per-subject entitlement set gets wrong.
  const coordinator = subjectOf({
    roles: ['coordinator'],
    companies: { a: ['ent:job:manage'], b: ['ent:event:manage'] },
  })

  it('allows the action only at the company that carries the entitlement', () => {
    expect(
      hasPermission(coordinator, 'job', 'create', { companyUid: co('a') }),
    ).toBe(true)
    expect(
      hasPermission(coordinator, 'job', 'create', { companyUid: co('b') }),
    ).toBe(false)
    expect(
      hasPermission(coordinator, 'job', 'create', { companyUid: co('c') }),
    ).toBe(false)
  })
})

describe('coordinator and company are not the same role', () => {
  const companies = { a: ['ent:event:manage'] as Entitlement[] }
  const coordinator = subjectOf({ roles: ['coordinator'], companies })
  const companyUser = subjectOf({ roles: ['company'], companies })

  it('withholds event deletion from a coordinator and grants attendance handling', () => {
    expect(
      hasPermission(coordinator, 'event', 'delete', { companyUid: co('a') }),
    ).toBe(false)
    expect(
      hasPermission(coordinator, 'event', 'listAttendants', {
        companyUid: co('a'),
      }),
    ).toBe(true)
    expect(
      hasPermission(coordinator, 'event', 'markAttended', {
        companyUid: co('a'),
      }),
    ).toBe(true)
  })

  it('mirrors that for a company user, who keeps deletion but not attendance', () => {
    expect(
      hasPermission(companyUser, 'event', 'delete', { companyUid: co('a') }),
    ).toBe(true)
    expect(
      hasPermission(companyUser, 'event', 'listAttendants', {
        companyUid: co('a'),
      }),
    ).toBe(false)
    expect(
      hasPermission(companyUser, 'event', 'markAttended', {
        companyUid: co('a'),
      }),
    ).toBe(false)
  })
})

describe('registration window', () => {
  const target = { targetUserUid: UserUid.parse('self'), event: eventWith() }

  it('is half-open — the closing instant denies', () => {
    expect(
      hasPermission(student, 'registration', 'create', target, at(before)),
    ).toBe(false)
    expect(
      hasPermission(student, 'registration', 'create', target, at(opens)),
    ).toBe(true)
    expect(
      hasPermission(student, 'registration', 'create', target, at(during)),
    ).toBe(true)
    expect(
      hasPermission(student, 'registration', 'create', target, at(closes)),
    ).toBe(false)
  })

  it('does not apply to an admin', () => {
    for (const now of [before, opens, during, closes]) {
      expect(
        hasPermission(admin, 'registration', 'create', target, at(now)),
      ).toBe(true)
    }
  })
})

describe('registration eligibility', () => {
  const restricted = {
    targetUserUid: UserUid.parse('self'),
    event: eventWith({
      kind: 'every',
      rules: [
        { kind: 'programme', programmes: ['mtdt'] },
        { kind: 'year', years: [4, 5] },
      ],
    }),
  }

  const create = (subject: Subject) =>
    hasPermission(subject, 'registration', 'create', restricted, at(during))

  it('admits a student the rule names and refuses one it does not', () => {
    expect(create(student)).toBe(true)
    expect(
      create(subjectOf({ roles: ['user'], programme: 'mtiot', year: 4 })),
    ).toBe(false)
    expect(
      create(subjectOf({ roles: ['user'], programme: 'mtdt', year: 2 })),
    ).toBe(false)
  })

  it('reads a legacy string year as a number', () => {
    // Widening against the endpoint this replaces, which compared '4' to 4 with
    // Array.includes and denied. Asserted explicitly so a regression is loud.
    expect(
      create(subjectOf({ roles: ['user'], programme: 'mtdt', year: '4' })),
    ).toBe(true)
  })

  it('fails closed on an attribute the subject does not carry', () => {
    expect(create(subjectOf({ roles: ['user'], year: 4 }))).toBe(false)
    expect(create(subjectOf({ roles: ['user'], programme: 'mtdt' }))).toBe(
      false,
    )
  })
})

describe('registration ownership', () => {
  const onBehalf = {
    targetUserUid: UserUid.parse('someone-else'),
    event: eventWith(),
  }

  it('is refused to everyone but an admin', () => {
    expect(
      hasPermission(student, 'registration', 'create', onBehalf, at(during)),
    ).toBe(false)
    expect(
      hasPermission(
        subjectOf({ roles: ['coordinator'] }),
        'registration',
        'create',
        onBehalf,
        at(during),
      ),
    ).toBe(false)
    expect(
      hasPermission(admin, 'registration', 'create', onBehalf, at(during)),
    ).toBe(true)
  })
})

describe('resume access', () => {
  const entitled = subjectOf({
    roles: ['company'],
    companies: { a: ['ent:resume:view'] },
  })
  const unentitled = subjectOf({
    roles: ['company'],
    companies: { a: ['ent:job:manage'] },
  })

  it('gates the full list on the entitlement, not the role', () => {
    expect(hasPermission(entitled, 'resume', 'read', { scope: 'all' })).toBe(
      true,
    )
    expect(hasPermission(unentitled, 'resume', 'read', { scope: 'all' })).toBe(
      false,
    )
    expect(hasPermission(student, 'resume', 'read', { scope: 'all' })).toBe(
      false,
    )
  })

  it('always lets an owner read their own', () => {
    expect(
      hasPermission(student, 'resume', 'read', {
        ownerUid: UserUid.parse('self'),
        scope: 'own',
      }),
    ).toBe(true)
    expect(
      hasPermission(student, 'resume', 'read', {
        ownerUid: UserUid.parse('other'),
        scope: 'own',
      }),
    ).toBe(false)
  })
})
