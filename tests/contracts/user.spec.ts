import { describe, expect, it } from 'vitest'
import { toV1User, UserInput } from '@/contracts/user'

const issues = (input: unknown) =>
  UserInput.safeParse(input).error?.issues.map((i) => [
    i.path.join('.'),
    i.message,
  ]) ?? []

describe('UserInput', () => {
  it('needs a study programme and year for a student', () => {
    expect(
      issues({ userType: 'basic', name: 'Ada', email: 'ada@example.com' }),
    ).toEqual([
      ['studyProgram', 'required'],
      ['currentYear', 'required'],
    ])
    expect(
      UserInput.parse({
        userType: 'basic',
        name: ' Ada ',
        email: 'ada@example.com',
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
        email: 'ada@example.com',
        currentYear: '',
      }),
    ).toMatchObject({ studyProgram: '', currentYear: null })
  })

  it('needs a company for a company account', () => {
    expect(
      issues({ userType: 'company', name: 'Ada', email: 'ada@example.com' }),
    ).toEqual([['companyUID', 'required']])
  })

  it('checks name and email', () => {
    expect(
      issues({
        userType: 'company',
        name: '',
        email: 'not-an-email',
        companyUID: 'c1',
      }),
    ).toEqual([
      ['name', 'required'],
      ['email', 'email'],
    ])
  })
})

describe('toV1User', () => {
  it('keeps company fields off a student and the other way round', () => {
    const student = toV1User('u1', {
      userType: 'basic',
      name: 'Ada',
      email: 'ada@example.com',
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
      account: { uid: 'u1', name: 'Ada', email: 'ada@example.com' },
    })
    const company = toV1User('u2', {
      userType: 'company',
      name: 'Bo',
      email: 'bo@example.com',
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
