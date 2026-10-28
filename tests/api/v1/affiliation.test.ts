/**
 * Setting a company's tier and entitlements, and forgetting them with the company (#640)
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import {
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

const entitlementsOf = async (token: string, company: string) =>
  (
    (await api('/api/v1/user/subject', { token })).body as {
      companies: Record<string, string[]>
    }
  ).companies[company]?.sort()

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner', cvAccess: false },
  })
})

describe('PUT /api/v1/company/affiliation', () => {
  it("lets an admin set the tier, and the company's users get what it grants", async () => {
    const admin = await createUser({ userType: 'admin' })
    const contact = await createUser({
      userType: 'company',
      companyUID: 'acme',
    })

    const response = await api('/api/v1/company/affiliation', {
      method: 'PUT',
      body: {
        companyUID: 'acme',
        tier: 'sponsor',
        overrides: { 'ent:resume:view': true },
      },
      token: admin.token,
    })

    expect(response.status).toBe(204)
    expect(await entitlementsOf(contact.token, 'acme')).toEqual([
      'ent:profile:manage',
      'ent:resume:view',
    ])
  })

  it("leaves it to admins, the company's own users included", async () => {
    const contact = await createUser({
      userType: 'company',
      companyUID: 'acme',
    })

    const response = await api('/api/v1/company/affiliation', {
      method: 'PUT',
      body: { companyUID: 'acme', tier: 'mainPartner' },
      token: contact.token,
    })

    expect(response.status).toBe(403)
    expect(await read('affiliations/acme/tier')).toBe('partner')
  })

  it('refuses an unknown tier and an unknown company', async () => {
    const admin = await createUser({ userType: 'admin' })

    for (const [body, code] of [
      [
        { companyUID: 'acme', tier: 'main-partner' },
        'company/invalid-affiliation',
      ],
      [{ companyUID: 'initech', tier: 'partner' }, 'company/not-found'],
    ] as const) {
      const response = await api('/api/v1/company/affiliation', {
        method: 'PUT',
        body,
        token: admin.token,
      })
      expect(response.body).toMatchObject({ code })
    }
  })
})

describe('DELETE /api/v1/company', () => {
  it('forgets the affiliation with the company', async () => {
    const admin = await createUser({ userType: 'admin' })
    await seed('affiliations/acme', { tier: 'partner', createdBy: 'test' })

    await api('/api/v1/company', {
      method: 'DELETE',
      body: { companyUID: 'acme' },
      token: admin.token,
    })

    expect(await read('affiliations/acme')).toBeNull()
  })
})
