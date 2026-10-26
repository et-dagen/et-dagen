import { describe, expect, it } from 'vitest'
import { entitledCompanyOf } from '@/server/adapters/rtdb/companyRepository'

describe('entitledCompanyOf', () => {
  it('reads the v1 company types as tiers', () => {
    expect(entitledCompanyOf('c', { type: 'main-partner' }).relationship).toBe(
      'mainPartner',
    )
    expect(entitledCompanyOf('c', { type: 'partner' }).relationship).toBe(
      'partner',
    )
    expect(entitledCompanyOf('c', { type: 'sponsor' }).relationship).toBe(
      'sponsor',
    )
    expect(entitledCompanyOf('c', { type: 'old' }).relationship).toBe('prior')
  })

  it('reads an unknown or missing type as a former company', () => {
    expect(entitledCompanyOf('c', { type: 'gold' }).relationship).toBe('prior')
    expect(entitledCompanyOf('c', {}).relationship).toBe('prior')
  })

  it('keeps résumé access to what cvAccess says', () => {
    expect(
      entitledCompanyOf('c', { type: 'main-partner' }).entitlementOverrides,
    ).toEqual({ 'ent:resume:view': false })
    expect(
      entitledCompanyOf('c', { type: 'sponsor', cvAccess: true })
        .entitlementOverrides,
    ).toEqual({ 'ent:resume:view': true })
  })
})
