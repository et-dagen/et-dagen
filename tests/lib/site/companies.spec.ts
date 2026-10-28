import { describe, expect, it } from 'vitest'
import { fillerCount, lineupOf } from '@/lib/site/companies'

describe('lineupOf', () => {
  const logo = 'https://example.com/logo.png'

  it('groups companies with a logo by tier, by name', () => {
    const lineup = lineupOf({
      a: { name: 'Sony', logo, tier: 'mainPartner' },
      b: { name: 'Nordic Semiconductor', logo, tier: 'partner' },
      c: { name: 'ABB', logo, tier: 'partner' },
      d: { name: 'Rockheim', logo, tier: 'sponsor' },
      e: { name: 'Gammel AS', logo, tier: 'prior' },
    })
    expect(lineup.mainPartner?.name).toBe('Sony')
    expect(lineup.partners.map((c) => c.name)).toEqual([
      'ABB',
      'Nordic Semiconductor',
    ])
    expect(lineup.sponsors.map((c) => c.name)).toEqual(['Rockheim'])
  })

  it('leaves out companies without a logo', () => {
    const lineup = lineupOf({ a: { name: 'Sony', tier: 'mainPartner' } })
    expect(lineup).toEqual({ mainPartner: null, partners: [], sponsors: [] })
  })

  it('copes with no companies', () => {
    expect(lineupOf(null).partners).toEqual([])
  })
})

describe('fillerCount', () => {
  it('closes a short last row', () => {
    expect(fillerCount(4 + 16, 6)).toBe(4)
    expect(fillerCount(3, 2)).toBe(1)
  })

  it('adds nothing to a full row', () => {
    expect(fillerCount(12, 6)).toBe(0)
    expect(fillerCount(0, 4)).toBe(0)
  })
})
