import { describe, expect, it } from 'vitest'
import { profileInput, toV1Profile } from '@/contracts/profile'

describe('profileInput', () => {
  it('needs a name, and a year from a student', () => {
    const student = profileInput(true)
    expect(student.safeParse({ name: ' ', currentYear: 3 }).success).toBe(false)
    expect(student.safeParse({ name: 'Ingrid' }).success).toBe(false)
    expect(student.parse({ name: ' Ingrid ', currentYear: '3' })).toEqual({
      name: 'Ingrid',
      currentYear: 3,
      dietaryRestrictions: [],
    })
  })

  it('takes no year from a company contact', () => {
    expect(profileInput(false).parse({ name: 'Kari' })).toEqual({
      name: 'Kari',
      currentYear: null,
      dietaryRestrictions: [],
    })
  })
})

describe('toV1Profile', () => {
  it('sends the stored programme back with the year as text, without doubles', () => {
    expect(
      toV1Profile(
        'u1',
        {
          name: 'Ingrid',
          currentYear: 3,
          dietaryRestrictions: ['gluten', 'gluten', 'nuts'],
        },
        'Elektronikk',
      ),
    ).toEqual({
      profile: {
        studyProgram: 'Elektronikk',
        currentYear: '3',
        dietaryRestrictions: ['gluten', 'nuts'],
      },
      account: { uid: 'u1', name: 'Ingrid' },
    })
  })
})
