import { describe, expect, it } from 'vitest'
import {
  accessOnSignUp,
  accessProblem,
  checkedAccess,
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

  it('reads what is withheld from an employee, once each', () => {
    expect(
      checkedAccess({
        roles: ['company'],
        memberships: [
          {
            companyUID: 'acme',
            kind: 'employee',
            withheld: ['ent:resume:view', 'ent:resume:view'],
          },
        ],
      }),
    ).toEqual({
      roles: ['company'],
      memberships: [
        { company: acme, kind: 'employee', withheld: ['ent:resume:view'] },
      ],
    })
  })

  it("refuses withholding from a coordinator, or what can't be withheld", () => {
    for (const membership of [
      { companyUID: 'acme', kind: 'coordinator', withheld: ['ent:job:manage'] },
      { companyUID: 'acme', kind: 'employee', withheld: ['ent:event:manage'] },
      { companyUID: 'acme', kind: 'employee', withheld: 'ent:job:manage' },
    ]) {
      expect(
        checkedAccess({
          roles: ['company', 'coordinator'],
          memberships: [membership],
        }),
      ).toEqual({ problem: 'user/invalid-access' })
    }
  })
})
