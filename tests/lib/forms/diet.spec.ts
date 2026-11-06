import { describe, expect, it } from 'vitest'
import { dietLabel, dietOf, typedOf } from '@/lib/forms/diet'

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

describe('dietLabel', () => {
  const t = (key: string) => `«${key}»`

  it('translates a restriction from the list and keeps a typed one as typed', () => {
    expect(dietLabel('gluten', t)).toBe('«dietary_restrictions.gluten»')
    expect(dietLabel('sesame', t)).toBe('sesame')
  })

  it('does not take a typed word for a label key', () => {
    expect(dietLabel('name', t)).toBe('name')
  })
})
