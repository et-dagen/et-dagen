/**
 * GET /api/v1/user/subject: what the client asks the permission table with
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import { createUser, resetEmulators, seed } from '@/tests/api/support/emulators'

beforeEach(resetEmulators)

describe('GET /api/v1/user/subject', () => {
  it("returns a contact's roles and their company's entitlements", async () => {
    await seed('companies/acme', {
      name: 'Acme',
      type: 'sponsor',
      cvAccess: true,
    })
    const { uid, token } = await createUser({
      userType: 'company',
      companyUID: 'acme',
    })

    const response = await api('/api/v1/user/subject', { token })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      uid,
      roles: ['company'],
      companies: {
        acme: expect.arrayContaining(['ent:profile:manage', 'ent:resume:view']),
      },
      applicant: null,
    })
  })

  it('answers 401 when signed out', async () => {
    const response = await api('/api/v1/user/subject')

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ code: 'auth/signed-out' })
  })
})
