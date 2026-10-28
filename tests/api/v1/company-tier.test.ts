/**
 * Company lists carry each company's tier, and for admins its entitlements (#640)
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import { createUser, resetEmulators, seed } from '@/tests/api/support/emulators'

type Listed = Record<string, { tier: string; entitlements?: string[] }>

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner', cvAccess: false },
    globex: { name: 'Globex', type: 'old' },
  })
  await seed('affiliations/globex', {
    tier: 'sponsor',
    overrides: { 'ent:resume:view': true },
    createdBy: 'test',
  })
})

describe('GET /api/v1/company', () => {
  it('gives everyone the tier, from the affiliation when there is one', async () => {
    const listed = (await api('/api/v1/company')).body as Listed

    expect(listed.acme).toMatchObject({ tier: 'partner' })
    expect(listed.globex).toMatchObject({ tier: 'sponsor' })
    expect(listed.acme).not.toHaveProperty('entitlements')
  })

  it('gives admins what each company is entitled to', async () => {
    const { token } = await createUser({ userType: 'admin' })

    const listed = (await api('/api/v1/company', { token })).body as Listed
    const one = (await api('/api/v1/company?companyUID=globex', { token }))
      .body as Listed

    expect(listed.acme?.entitlements).not.toContain('ent:resume:view')
    expect(one.globex?.entitlements?.sort()).toEqual([
      'ent:profile:manage',
      'ent:resume:view',
    ])
  })
})
