import { describe, expect, it } from 'vitest'
import {
  afterTheFair,
  changesAtReset,
  checkedAffiliation,
  nextFairFrom,
} from '@/domain/authorization/affiliation'
import { Instant } from '@/domain/time'

describe('checkedAffiliation', () => {
  it('reads a tier with overrides, and a tier alone', () => {
    expect(
      checkedAffiliation({
        tier: 'sponsor',
        overrides: { 'ent:resume:view': true, 'ent:profile:manage': false },
      }),
    ).toEqual({
      tier: 'sponsor',
      overrides: { 'ent:resume:view': true, 'ent:profile:manage': false },
    })
    expect(checkedAffiliation({ tier: 'partner' })).toEqual({
      tier: 'partner',
      overrides: {},
    })
  })

  it('refuses unknown tiers and entitlements, and overrides that are not true or false', () => {
    for (const body of [
      undefined,
      { tier: 'main-partner' },
      { tier: 'partner', overrides: { 'ent:everything': true } },
      { tier: 'partner', overrides: { 'ent:resume:view': 'yes' } },
      { tier: 'partner', overrides: null },
    ]) {
      expect(checkedAffiliation(body)).toEqual({
        problem: 'company/invalid-affiliation',
      })
    }
  })
})

describe('nextFairFrom', () => {
  it('is 1 March of the same year, at midnight in Oslo', () => {
    expect(nextFairFrom(Instant.parse('2027-06-01T04:00:00.000Z'))).toBe(
      '2027-02-28T23:00:00.000Z',
    )
  })
})

describe('afterTheFair', () => {
  it('makes a company former, drops its exceptions and remembers its tier', () => {
    expect(
      afterTheFair({ tier: 'partner', overrides: { 'ent:resume:view': true } }),
    ).toEqual({ tier: 'prior', overrides: {}, formerTier: 'partner' })
  })

  it('forgets the tier of a company that was former already', () => {
    expect(
      afterTheFair({ tier: 'prior', overrides: {}, formerTier: 'sponsor' }),
    ).toEqual({ tier: 'prior', overrides: {} })
  })
})

describe('changesAtReset', () => {
  it('leaves a former company with nothing extra', () => {
    expect(changesAtReset({ tier: 'prior', overrides: {} })).toBe(false)
  })

  it('changes a tier, an exception, or a remembered tier', () => {
    expect(changesAtReset({ tier: 'sponsor', overrides: {} })).toBe(true)
    expect(
      changesAtReset({ tier: 'prior', overrides: { 'ent:resume:view': true } }),
    ).toBe(true)
    expect(
      changesAtReset({ tier: 'prior', overrides: {}, formerTier: 'partner' }),
    ).toBe(true)
  })
})
