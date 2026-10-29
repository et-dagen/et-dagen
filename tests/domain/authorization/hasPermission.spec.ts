import { describe, expect, it } from 'vitest'
import type { Entitlement } from '~/domain/authorization/entitlements'
import { hasPermission } from '~/domain/authorization/hasPermission'
import type { Environment } from '~/domain/authorization/permissions'
import type { Subject } from '~/domain/authorization/subject'
import type { HasRegistration } from '~/domain/event/event'
import type { EligibilityRule } from '~/domain/authorization/eligibility'
import { CompanyUid } from '@/domain/business/company'
import { Duration } from '@/domain/time/duration'
import { Term, type StudyYear } from '@/domain/ntnu'
import { Instant } from '@/domain/time/instant'
import { UserUid, type Role } from '@/domain/user'

// Fixtures name uids as plain strings and brand them here, so the specs read as data rather than
// as a string of parse calls. `co` is the same for the company uids the permission table takes.
const co = CompanyUid.parse

const subjectOf = (subject: {
  roles: Role[]
  companies?: Record<string, Entitlement[]>
  applicant?: { programme: string; year: StudyYear }
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
  applicant: subject.applicant
    ? { ...subject.applicant, graduation: Term.parse('2028-spring') }
    : null,
})

const opens = Instant.parse('2026-08-01T10:00:00.000Z')
const before = Instant.parse('2026-07-31T10:00:00.000Z')
const during = Instant.parse('2026-08-05T10:00:00.000Z')
const closes = Instant.parse('2026-08-15T10:00:00.000Z') // exactly endOf(period)

const at = (now: typeof opens): Environment => ({ now })

const eventWith = (
  eligibility?: EligibilityRule,
  host = 'host',
): HasRegistration & { companyUid: CompanyUid } => ({
  companyUid: CompanyUid.parse(host),
  registration: {
    period: { start: opens, duration: Duration.fromDays(14) },
    attendanceLimit: null,
    eligibility,
  },
})

const admin = subjectOf({ roles: ['admin'] })
const student = subjectOf({
  roles: ['user'],
  applicant: { programme: 'mtdt', year: 4 },
})

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

  it('denies names that only exist on Object.prototype', () => {
    // A name read from a request at runtime must not reach an inherited method,
    // which would run as a predicate and return a truthy string.
    const own = { uid: UserUid.parse('self'), scope: 'own' as const }
    const anyResource = hasPermission as (...args: unknown[]) => boolean
    expect(anyResource(student, 'user', 'toString', own)).toBe(false)
    expect(anyResource(student, 'toString', 'call', own)).toBe(false)
    expect(anyResource(admin, 'company', 'constructor', { uid: co('a') })).toBe(
      false,
    )
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
  const companyUser = subjectOf({
    roles: ['company'],
    companies: { a: ['ent:job:manage'], b: ['ent:resume:view'] },
  })

  it('allows the action only at the company that carries the entitlement', () => {
    expect(
      hasPermission(companyUser, 'job', 'create', { companyUid: co('a') }),
    ).toBe(true)
    expect(
      hasPermission(companyUser, 'job', 'create', { companyUid: co('b') }),
    ).toBe(false)
    expect(
      hasPermission(companyUser, 'job', 'create', { companyUid: co('c') }),
    ).toBe(false)
  })
})

describe('taking attendance', () => {
  const attendance = (subject: Subject, company: string) =>
    ['listAttendants', 'markAttended'].map((action) =>
      hasPermission(subject, 'event', action as 'markAttended', {
        companyUid: co(company),
      }),
    )

  it("lets every coordinator take attendance at E&T-dagene's own events", () => {
    const coordinator = subjectOf({ roles: ['coordinator'] })

    expect(attendance(coordinator, 'etdagene')).toEqual([true, true])
    expect(attendance(coordinator, 'a')).toEqual([false, false])
    expect(attendance(subjectOf({ roles: ['user'] }), 'etdagene')).toEqual([
      false,
      false,
    ])
    expect(attendance(subjectOf({ roles: ['company'] }), 'etdagene')).toEqual([
      false,
      false,
    ])
  })

  it("lets a coordinator run a sponsor's events and take attendance there", () => {
    const coordinator = subjectOf({
      roles: ['coordinator'],
      companies: { a: ['ent:profile:manage'] as Entitlement[] },
    })

    expect(attendance(coordinator, 'a')).toEqual([true, true])
    expect(
      hasPermission(coordinator, 'event', 'update', { companyUid: co('a') }),
    ).toBe(true)
  })
})

describe('coordinator and company are not the same role', () => {
  // a sponsor: the contract gives the company its profile and nothing more
  const companies = { a: ['ent:profile:manage'] as Entitlement[] }
  const coordinator = subjectOf({ roles: ['coordinator'], companies })
  const companyUser = subjectOf({ roles: ['company'], companies })
  const event = (subject: Subject, action: string, company = 'a') =>
    hasPermission(subject, 'event', action as 'update', {
      companyUid: co(company),
    })

  it("lets a coordinator run their companies' events, whatever the tier", () => {
    for (const action of ['create', 'update', 'delete', 'list']) {
      expect(event(coordinator, action)).toBe(true)
      expect(event(coordinator, action, 'c')).toBe(false)
    }
    expect(event(coordinator, 'listAttendants')).toBe(true)
    expect(event(coordinator, 'markAttended')).toBe(true)
  })

  it('shows a company user their events, but leaves them to E&T-dagene', () => {
    expect(event(companyUser, 'list')).toBe(true)
    expect(event(companyUser, 'list', 'c')).toBe(false)
    for (const action of [
      'create',
      'update',
      'delete',
      'listAttendants',
      'markAttended',
    ]) {
      expect(event(companyUser, action)).toBe(false)
    }
  })

  it("lets a coordinator manage every company's jobs, and a company user only its own", () => {
    for (const company of ['a', 'c']) {
      expect(
        hasPermission(coordinator, 'job', 'update', {
          companyUid: co(company),
        }),
      ).toBe(true)
    }
    expect(hasPermission(coordinator, 'job', 'update', undefined)).toBe(true)
    expect(
      hasPermission(companyUser, 'job', 'update', { companyUid: co('a') }),
    ).toBe(false)
  })

  it('lets a coordinator edit the profiles of their companies only', () => {
    expect(
      hasPermission(coordinator, 'company', 'update', { uid: co('a') }),
    ).toBe(true)
    expect(
      hasPermission(coordinator, 'company', 'update', { uid: co('c') }),
    ).toBe(false)
    expect(
      hasPermission(coordinator, 'company', 'entitle', { uid: co('a') }),
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
      kind: 'and',
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
      create(
        subjectOf({
          roles: ['user'],
          applicant: { programme: 'mtiot', year: 4 },
        }),
      ),
    ).toBe(false)
    expect(
      create(
        subjectOf({
          roles: ['user'],
          applicant: { programme: 'mtdt', year: 2 },
        }),
      ),
    ).toBe(false)
  })

  it('fails closed on a subject that is not an enrolled student', () => {
    expect(create(subjectOf({ roles: ['user'] }))).toBe(false)
    expect(create(subjectOf({ roles: ['company'] }))).toBe(false)
  })
})

describe('a coordinator signing up', () => {
  const coordinator = subjectOf({
    roles: ['coordinator'],
    companies: { mine: ['ent:profile:manage'] },
    applicant: { programme: 'mtel', year: 3 },
  })
  const signUp = (host: string) =>
    hasPermission(
      coordinator,
      'registration',
      'create',
      {
        targetUserUid: UserUid.parse('self'),
        event: eventWith(undefined, host),
      },
      at(during),
    )

  it("signs up like a student for another company's event", () => {
    expect(signUp('host')).toBe(true)
  })

  it("is kept off the events they take attendance at, E&T-dagene's included", () => {
    expect(signUp('mine')).toBe(false)
    expect(signUp('etdagene')).toBe(false)
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

describe('company profiles and hosted events', () => {
  const companyUser = subjectOf({
    roles: ['company'],
    companies: { a: ['ent:event:manage', 'ent:profile:manage'] },
  })

  it("lists a company's events only for its own users", () => {
    expect(
      hasPermission(companyUser, 'event', 'list', { companyUid: co('a') }),
    ).toBe(true)
    expect(
      hasPermission(companyUser, 'event', 'list', { companyUid: co('b') }),
    ).toBe(false)
  })

  it('lists every company only for an admin', () => {
    expect(hasPermission(admin, 'event', 'list', undefined)).toBe(true)
    expect(hasPermission(companyUser, 'event', 'list', undefined)).toBe(false)
  })

  it('leaves the contract to admins', () => {
    expect(
      hasPermission(companyUser, 'company', 'update', { uid: co('a') }),
    ).toBe(true)
    expect(
      hasPermission(companyUser, 'company', 'entitle', { uid: co('a') }),
    ).toBe(false)
    expect(hasPermission(admin, 'company', 'entitle', { uid: co('a') })).toBe(
      true,
    )
  })

  it('creates a company only as an admin', () => {
    expect(hasPermission(admin, 'company', 'create', undefined)).toBe(true)
    expect(hasPermission(companyUser, 'company', 'create', undefined)).toBe(
      false,
    )
  })
})
