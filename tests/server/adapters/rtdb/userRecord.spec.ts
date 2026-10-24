import { describe, expect, it } from 'vitest'
import { yearAt, type ProgrammeType } from '@/domain/ntnu'
import { Instant } from '@/domain/time'
import { subjectOf } from '@/server/adapters/rtdb/userRecord'

const now = Instant.parse('2026-10-24T12:00:00.000Z')
const FIVE_YEARS: ProgrammeType = {
  kind: 'integratedMaster',
  duration: 5,
  years: [1, 2, 3, 4, 5],
}

describe('subjectOf', () => {
  it('reads admins, company users and everyone else as students', () => {
    expect(subjectOf('a', { userType: 'admin' }, now).roles).toEqual(['admin'])
    expect(subjectOf('c', { userType: 'company' }, now).roles).toEqual([
      'company',
    ])
    expect(subjectOf('s', { userType: 'basic' }, now).roles).toEqual(['user'])
    expect(subjectOf('s', { userType: null }, now).roles).toEqual(['user'])
  })

  it('makes a student with a programme and year an applicant', () => {
    const { applicant } = subjectOf(
      's',
      { studyProgram: 'MTEL', currentYear: '3' },
      now,
    )

    expect(applicant).toMatchObject({ programme: 'MTEL', year: 3 })
    expect(yearAt(FIVE_YEARS, applicant!.graduation, now)).toBe(3)
  })

  it('gives no applicant without a programme or a valid year', () => {
    expect(subjectOf('s', { currentYear: 3 }, now).applicant).toBeNull()
    expect(
      subjectOf('s', { studyProgram: 'MTEL', currentYear: 6 }, now).applicant,
    ).toBeNull()
  })

  it('reads the year the same way in spring', () => {
    const spring = Instant.parse('2027-03-01T12:00:00.000Z')
    const { applicant } = subjectOf(
      's',
      { studyProgram: 'MTEL', currentYear: 5 },
      spring,
    )

    expect(applicant?.graduation).toBe('2027-spring')
    expect(yearAt(FIVE_YEARS, applicant!.graduation, spring)).toBe(5)
  })
})
