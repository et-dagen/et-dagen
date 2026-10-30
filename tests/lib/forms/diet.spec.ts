import { describe, expect, it } from 'vitest'
import { dietOf, typedOf } from '@/lib/forms/diet'

const known = ['vegan', 'gluten']

describe('typedOf', () => {
  it('joins the restrictions that are not on the list', () => {
    expect(typedOf(['vegan', 'sesame', 'kiwi'], known)).toBe('sesame, kiwi')
  })
})

describe('dietOf', () => {
  it('keeps the chosen ones first, then the typed ones, trimmed and without blanks', () => {
    expect(dietOf(['gluten'], ' sesame, ,kiwi ')).toEqual([
      'gluten',
      'sesame',
      'kiwi',
    ])
  })
})
