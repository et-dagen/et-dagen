import { describe, expect, it } from 'vitest'
import { entitlementsFor } from '@/domain/authorization/entitlements'
import { entitledFromAffiliation } from '@/server/adapters/rtdb/accessRecords'

describe('entitledFromAffiliation', () => {
  it('reads the tier and its overrides', () => {
    const company = entitledFromAffiliation('acme', 'Acme', {
      tier: 'sponsor',
      overrides: { 'ent:resume:view': true },
    })

    expect(company.relationship).toBe('sponsor')
    expect([...entitlementsFor(company)].sort()).toEqual([
      'ent:profile:manage',
      'ent:resume:view',
    ])
  })

  it('reads an unknown or missing tier as a former company and ignores unknown overrides', () => {
    const company = entitledFromAffiliation('acme', 'Acme', {
      tier: 'platinum',
      overrides: { 'ent:job:manage': true, 'ent:everything': true, x: 'yes' },
    })

    expect(company.relationship).toBe('prior')
    expect([...entitlementsFor(company)]).toEqual(['ent:job:manage'])
    expect(entitledFromAffiliation('acme', 'Acme', {}).relationship).toBe(
      'prior',
    )
  })
})
