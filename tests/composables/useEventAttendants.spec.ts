import { describe, expect, it } from 'vitest'
import { attendantsOf, dietaryCounts } from '@/composables/useEventAttendants'

const users = [
  { uid: 'ada', dietaryRestrictions: ['vegan'] },
  { uid: 'bo', dietaryRestrictions: ['vegan', 'gluten'] },
  { uid: 'cy', dietaryRestrictions: null },
]

describe('attendantsOf', () => {
  it('finds the users signed up, keyed by uid as the database stores them', () => {
    const attendants = {
      ada: { attended: false, registeredAt: 1 },
      cy: { attended: true, registeredAt: 2 },
    }
    expect(attendantsOf(attendants, users).map((u) => u.uid)).toEqual([
      'ada',
      'cy',
    ])
  })

  it('finds nobody on an event without attendants or users', () => {
    expect(attendantsOf(undefined, users)).toEqual([])
    expect(attendantsOf({ ada: {} }, null)).toEqual([])
  })
})

describe('dietaryCounts', () => {
  it('counts each restriction across attendants', () => {
    expect(dietaryCounts(users)).toEqual({ vegan: 2, gluten: 1 })
  })
})
