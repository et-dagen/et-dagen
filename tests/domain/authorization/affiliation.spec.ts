import { describe, expect, it } from 'vitest'
import { checkedAffiliation } from '@/domain/authorization/affiliation'

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
