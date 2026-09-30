import { describe, expect, it } from 'vitest'
import { entitlementsFor } from '~/domain/authorization/entitlements'

const setOf = (...args: Parameters<typeof entitlementsFor>) => [
  ...entitlementsFor(...args),
]

describe('relationship defaults', () => {
  it('grants a main partner everything', () => {
    expect(setOf({ relationship: 'mainPartner' }).sort()).toEqual([
      'ent:event:manage',
      'ent:job:manage',
      'ent:profile:manage',
      'ent:resume:view',
    ])
  })

  it('grants a partner the same as a main partner', () => {
    expect(setOf({ relationship: 'partner' }).sort()).toEqual(
      setOf({ relationship: 'mainPartner' }).sort(),
    )
  })

  it('grants sponsors and prior companies nothing', () => {
    expect(setOf({ relationship: 'sponsor' })).toEqual([])
    expect(setOf({ relationship: 'prior' })).toEqual([])
  })

  it('falls through untouched when no override map is present', () => {
    expect(
      setOf({ relationship: 'partner', entitlementOverrides: undefined }),
    ).toEqual(setOf({ relationship: 'partner' }))
  })
})

describe('overrides', () => {
  it('adds an entitlement the tier does not grant', () => {
    expect(
      setOf({
        relationship: 'sponsor',
        entitlementOverrides: { 'ent:profile:manage': true },
      }),
    ).toEqual(['ent:profile:manage'])
  })

  it('removes an entitlement the tier does grant', () => {
    // The live case: the repository mapper writes this from cvAccess on every read.
    expect(
      setOf({
        relationship: 'mainPartner',
        entitlementOverrides: { 'ent:resume:view': false },
      }),
    ).not.toContain('ent:resume:view')
  })

  it('is a no-op when it names something the tier already grants', () => {
    expect(
      setOf({
        relationship: 'mainPartner',
        entitlementOverrides: { 'ent:job:manage': true },
      }).sort(),
    ).toEqual(setOf({ relationship: 'mainPartner' }).sort())
  })

  it('is not gated by tier — prior can be handed all four', () => {
    expect(
      setOf({
        relationship: 'prior',
        entitlementOverrides: {
          'ent:resume:view': true,
          'ent:job:manage': true,
          'ent:event:manage': true,
          'ent:profile:manage': true,
        },
      }).sort(),
    ).toEqual([
      'ent:event:manage',
      'ent:job:manage',
      'ent:profile:manage',
      'ent:resume:view',
    ])
  })
})
