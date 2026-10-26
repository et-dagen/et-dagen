import { describe, expect, it } from 'vitest'
import { yearAt, type ProgrammeType } from '@/domain/ntnu'
import { Instant } from '@/domain/time'
import { storedUserOf } from '@/server/adapters/rtdb/userRecord'

const now = Instant.parse('2026-10-24T12:00:00.000Z')
const FIVE_YEARS: ProgrammeType = {
  kind: 'integratedMaster',
  duration: 5,
  years: [1, 2, 3, 4, 5],
}

const none = { roles: null, memberships: null }

describe('storedUserOf', () => {
  it('goes by stored roles and active memberships, not the v1 fields', () => {
    const user = storedUserOf(
      { userType: 'company', companyUID: 'acme' },
      now,
      {
        roles: { coordinator: {}, nonsense: {} },
        memberships: {
          globex: { kind: 'coordinator' },
          gone: { kind: 'coordinator', endedAt: now },
        },
      },
    )

    expect(user.roles).toEqual(['coordinator'])
    expect(user.companies).toEqual(['globex'])
  })

  it('gives a user without stored roles no roles and no companies', () => {
    expect(
      storedUserOf({ userType: 'admin', companyUID: 'acme' }, now, none),
    ).toMatchObject({ roles: [], companies: [] })
  })

  it('makes a student with a programme and year an applicant', () => {
    const { applicant } = storedUserOf(
      { studyProgram: 'MTEL', currentYear: '3' },
      now,
      none,
    )

    expect(applicant).toMatchObject({ programme: 'MTEL', year: 3 })
    expect(yearAt(FIVE_YEARS, applicant!.graduation, now)).toBe(3)
  })

  it('gives no applicant without a programme or a valid year', () => {
    expect(storedUserOf({ currentYear: 3 }, now, none).applicant).toBeNull()
    expect(
      storedUserOf({ studyProgram: 'MTEL', currentYear: 6 }, now, none)
        .applicant,
    ).toBeNull()
  })

  it('reads the year the same way in spring', () => {
    const spring = Instant.parse('2027-03-01T12:00:00.000Z')
    const { applicant } = storedUserOf(
      { studyProgram: 'MTEL', currentYear: 5 },
      spring,
      none,
    )

    expect(applicant?.graduation).toBe('2027-spring')
    expect(yearAt(FIVE_YEARS, applicant!.graduation, spring)).toBe(5)
  })
})
