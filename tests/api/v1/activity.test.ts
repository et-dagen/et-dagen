/**
 * The admin dashboard's activity log, fed by finished requests
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import { createUser, resetEmulators, seed } from '@/tests/api/support/emulators'

interface Overview {
  entries: {
    kind: string
    path: string
    status: number
    actor: string | null
  }[]
}

// the journal is written after the response, so give it a moment
async function journalOf(token: string, kind: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const { body } = await api('/api/v1/activity?days=1', { token })
    const found = (body as Overview).entries.filter((e) => e.kind === kind)
    if (found.length) return found
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return []
}

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner', cvAccess: false },
  })
})

describe('GET /api/v1/activity', () => {
  it('is for admins only', async () => {
    const contact = await createUser({
      userType: 'company',
      companyUID: 'acme',
    })
    expect((await api('/api/v1/activity')).status).toBe(401)
    expect(
      (await api('/api/v1/activity', { token: contact.token })).status,
    ).toBe(403)
  })

  it('notes a contract change with who made it', async () => {
    const admin = await createUser({ userType: 'admin' })
    await api('/api/v1/company/affiliation', {
      method: 'PUT',
      body: { companyUID: 'acme', tier: 'sponsor' },
      token: admin.token,
    })

    const [entry] = await journalOf(admin.token, 'contract-changed')
    expect(entry).toMatchObject({
      path: '/api/v1/company/affiliation',
      status: 204,
      actor: admin.uid,
    })
  })

  it('notes a refusal on the API', async () => {
    const admin = await createUser({ userType: 'admin' })
    await api('/api/v1/user/access?uid=someone')

    const refused = await journalOf(admin.token, 'refused')
    expect(refused[0]).toMatchObject({
      path: '/api/v1/user/access',
      status: 401,
      actor: null,
    })
  })
})
