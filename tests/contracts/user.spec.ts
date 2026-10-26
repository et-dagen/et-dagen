import { describe, expect, it } from 'vitest'
import { toV1User, UserInput, userTypeOf } from '@/contracts/user'

const issues = (input: unknown) =>
  UserInput.safeParse(input).error?.issues.map((i) => [
    i.path.join('.'),
    i.message,
  ]) ?? []

describe('UserInput', () => {
  it('needs a study programme and year for a student', () => {
    expect(issues({ userType: 'basic', name: 'Ada' })).toEqual([
      ['studyProgram', 'required'],
      ['currentYear', 'required'],
    ])
    expect(
      UserInput.parse({
        userType: 'basic',
        name: ' Ada ',
        studyProgram: 'Kybernetikk',
        currentYear: '4',
      }),
    ).toMatchObject({ name: 'Ada', currentYear: 4, dietaryRestrictions: [] })
  })

  it('lets an admin go without a programme', () => {
    expect(
      UserInput.parse({
        userType: 'admin',
        name: 'Ada',
        currentYear: '',
      }),
    ).toMatchObject({ studyProgram: '', currentYear: null })
  })

  it('needs a company for a company account', () => {
    expect(issues({ userType: 'company', name: 'Ada' })).toEqual([
      ['companyUID', 'required'],
    ])
  })

  it('needs a programme, a year and at least one company for a coordinator', () => {
    expect(
      issues({ userType: 'coordinator', name: 'Ada', companyUIDs: [] }),
    ).toEqual([
      ['studyProgram', 'required'],
      ['currentYear', 'required'],
      ['companyUIDs', 'required'],
    ])
  })

  it('needs a name', () => {
    expect(
      issues({
        userType: 'company',
        name: '',
        companyUID: 'c1',
      }),
    ).toEqual([['name', 'required']])
  })
})

describe('toV1User', () => {
  it('keeps company fields off a student and the other way round', () => {
    const student = toV1User('u1', {
      userType: 'basic',
      name: 'Ada',
      studyProgram: 'Kybernetikk',
      currentYear: 4,
      dietaryRestrictions: ['milk', 'milk', 'halal'],
    })
    expect(student).toEqual({
      profile: {
        uid: 'u1',
        userType: 'basic',
        studyProgram: 'Kybernetikk',
        currentYear: '4',
        companyUID: null,
        dietaryRestrictions: ['milk', 'halal'],
      },
      account: { uid: 'u1', name: 'Ada' },
      access: { uid: 'u1', roles: ['user'], memberships: [] },
    })
    const company = toV1User('u2', {
      userType: 'company',
      name: 'Bo',
      companyUID: 'c1',
      dietaryRestrictions: [],
    })
    expect(company.profile).toMatchObject({
      studyProgram: null,
      currentYear: null,
      companyUID: 'c1',
    })
  })
})

describe('toV1User access', () => {
  it('makes a coordinator a student with coordinator memberships', () => {
    const { profile, access } = toV1User('u3', {
      userType: 'coordinator',
      name: 'Cy',
      studyProgram: 'Kybernetikk',
      currentYear: 2,
      companyUIDs: ['c1', 'c2'],
      dietaryRestrictions: [],
    })
    expect(profile.userType).toBe('basic')
    expect(access).toEqual({
      uid: 'u3',
      roles: ['coordinator'],
      memberships: [
        { companyUID: 'c1', kind: 'coordinator' },
        { companyUID: 'c2', kind: 'coordinator' },
      ],
    })
  })

  it('makes a company account an employee of its company', () => {
    const { access } = toV1User('u2', {
      userType: 'company',
      name: 'Bo',
      companyUID: 'c1',
      dietaryRestrictions: [],
    })
    expect(access).toEqual({
      uid: 'u2',
      roles: ['company'],
      memberships: [{ companyUID: 'c1', kind: 'employee' }],
    })
  })
})

describe('userTypeOf', () => {
  it('shows the role with the most access, with its companies', () => {
    const coordinator = {
      roles: ['coordinator', 'user'],
      memberships: [{ companyUID: 'c1', kind: 'coordinator' as const }],
    }
    expect(userTypeOf(coordinator)).toEqual({
      userType: 'coordinator',
      companyUIDs: ['c1'],
    })
    expect(userTypeOf({ roles: ['user'], memberships: [] }).userType).toBe(
      'basic',
    )
    expect(
      userTypeOf({ ...coordinator, roles: ['admin', 'coordinator'] }).userType,
    ).toBe('admin')
  })
})
