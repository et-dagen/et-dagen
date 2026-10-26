import { describe, expect, it } from 'vitest'
import {
  accessOnSignUp,
  accessProblem,
  checkedAccess,
  migratedAccess,
} from '@/domain/authorization/access'
import { CompanyUid } from '@/domain/business/company'

const acme = CompanyUid.parse('acme')

describe('accessProblem', () => {
  it('accepts a coordinator of two companies and a contact for one', () => {
    expect(
      accessProblem({
        roles: ['user', 'coordinator'],
        memberships: [
          { company: acme, kind: 'coordinator' },
          { company: CompanyUid.parse('globex'), kind: 'coordinator' },
        ],
      }),
    ).toBeNull()
    expect(
      accessProblem({
        roles: ['company'],
        memberships: [{ company: acme, kind: 'employee' }],
      }),
    ).toBeNull()
  })

  it('refuses a user without roles', () => {
    expect(accessProblem({ roles: [], memberships: [] })).toBe('no-roles')
  })

  it('refuses a membership without the role its kind comes with', () => {
    expect(
      accessProblem({
        roles: ['user'],
        memberships: [{ company: acme, kind: 'coordinator' }],
      }),
    ).toBe('membership-without-role')
    expect(
      accessProblem({
        roles: ['coordinator'],
        memberships: [{ company: acme, kind: 'employee' }],
      }),
    ).toBe('membership-without-role')
  })

  it('refuses the same company twice', () => {
    expect(
      accessProblem({
        roles: ['company', 'coordinator'],
        memberships: [
          { company: acme, kind: 'employee' },
          { company: acme, kind: 'coordinator' },
        ],
      }),
    ).toBe('duplicate-membership')
  })
})

describe('migratedAccess', () => {
  it('makes a v1 company user a coordinator and leaves other roles alone', () => {
    expect(migratedAccess({ roles: ['company'], companies: [acme] })).toEqual({
      roles: ['coordinator'],
      memberships: [{ company: acme, kind: 'coordinator' }],
    })
    expect(migratedAccess({ roles: ['admin'], companies: [] })).toEqual({
      roles: ['admin'],
      memberships: [],
    })
  })
})

describe('accessOnSignUp', () => {
  it('makes a new account a student, or with a code a contact for its company', () => {
    expect(accessOnSignUp(null)).toEqual({ roles: ['user'], memberships: [] })
    expect(accessOnSignUp(acme)).toEqual({
      roles: ['company'],
      memberships: [{ company: acme, kind: 'employee' }],
    })
  })
})

describe('checkedAccess', () => {
  it('reads the admin form body', () => {
    expect(
      checkedAccess({
        roles: ['coordinator', 'user', 'user'],
        memberships: [{ companyUID: 'acme', kind: 'coordinator' }],
      }),
    ).toEqual({
      roles: ['coordinator', 'user'],
      memberships: [{ company: acme, kind: 'coordinator' }],
    })
  })

  it('refuses unknown roles and kinds and a missing company', () => {
    for (const body of [
      undefined,
      { roles: ['owner'], memberships: [] },
      { roles: ['user'] },
      {
        roles: ['company'],
        memberships: [{ companyUID: 'acme', kind: 'boss' }],
      },
      { roles: ['company'], memberships: [{ kind: 'employee' }] },
    ]) {
      expect(checkedAccess(body)).toEqual({ problem: 'user/invalid-access' })
    }
  })
})
