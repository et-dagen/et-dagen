import { describe, expect, it } from 'vitest'
import {
  CompanyJoin,
  StudentSignup,
  toV1User,
  UserInput,
} from '@/contracts/user'

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

const signupIssues = (input: unknown) =>
  StudentSignup.safeParse(input).error?.issues.map((i) => [
    i.path.join('.'),
    i.message,
  ]) ?? []

describe('StudentSignup', () => {
  const valid = {
    name: ' Ada ',
    email: ' ada@stud.ntnu.no ',
    password: 'abc12345',
    studyProgram: 'Kybernetikk',
    currentYear: '2',
  }

  it('trims the name and address and reads the year as a number', () => {
    expect(StudentSignup.parse(valid)).toEqual({
      name: 'Ada',
      email: 'ada@stud.ntnu.no',
      password: 'abc12345',
      studyProgram: 'Kybernetikk',
      currentYear: 2,
      dietaryRestrictions: [],
    })
  })

  it('names each missing field', () => {
    expect(signupIssues({}).map(([path]) => path)).toEqual([
      'name',
      'email',
      'password',
      'studyProgram',
      'currentYear',
    ])
  })

  it('keeps the password rule: 8 characters, 3 letters, 3 digits', () => {
    const passwordIssue = (password: string) =>
      signupIssues({ ...valid, password }).map(([, message]) => message)
    expect(passwordIssue('ab12')).toContain('password_length')
    expect(passwordIssue('12345678a')).toEqual(['password_letters'])
    expect(passwordIssue('abcdefgh12')).toEqual(['password_digits'])
    expect(passwordIssue('abc123xy')).toEqual([])
  })

  it('refuses an address without a domain', () => {
    expect(signupIssues({ ...valid, email: 'ada' })).toEqual([
      ['email', 'email'],
    ])
  })
})

describe('CompanyJoin', () => {
  it('needs the code', () => {
    expect(
      CompanyJoin.safeParse({
        name: 'Bo',
        email: 'bo@firma.no',
        password: 'abc12345',
      }).error?.issues.map((i) => i.path.join('.')),
    ).toEqual(['code'])
  })
})
