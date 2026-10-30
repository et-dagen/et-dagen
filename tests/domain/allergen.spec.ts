import { describe, expect, it } from 'vitest'
import { dietaryCounts } from '@/domain/allergen'

describe('dietaryCounts', () => {
  it('counts each restriction across people', () => {
    expect(
      dietaryCounts([
        { dietaryRestrictions: ['vegan'] },
        { dietaryRestrictions: ['vegan', 'gluten'] },
        { dietaryRestrictions: null },
        {},
      ]),
    ).toEqual({ vegan: 2, gluten: 1 })
  })
})
