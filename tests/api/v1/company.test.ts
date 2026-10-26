/**
 * Who may create, change, remove and list the events of a company
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import {
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

const company = (type: string) => ({
  name: `${type} AS`,
  type,
  webpage: 'https://example.com',
  cvAccess: false,
})
const contactFor = (companyUID: string) =>
  createUser({ userType: 'company', companyUID })
const admin = () => createUser({ userType: 'admin' })

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: company('partner'),
    globex: company('partner'),
    initech: company('sponsor'),
    hooli: company('old'),
  })
  await seed('events', {
    talk: { title: 'Talk', companyUID: 'acme' },
    dinner: { title: 'Dinner', companyUID: 'globex' },
  })
})

describe('PUT /api/v1/company', () => {
  const rename = (companyUID: string, token?: string) =>
    api('/api/v1/company', {
      method: 'PUT',
      body: {
        companyUID,
        name: 'Renamed',
        cvAccess: true,
        type: 'main-partner',
      },
      token,
    })

  it("changes a contact's own profile, but not its contract", async () => {
    const { token } = await contactFor('acme')

    expect((await rename('acme', token)).status).toBe(204)
    await expect
      .poll(() => read('companies/acme'))
      .toMatchObject({ name: 'Renamed', cvAccess: false, type: 'partner' })
  })

  it('lets a sponsor change its profile', async () => {
    const { token } = await contactFor('initech')

    expect((await rename('initech', token)).status).toBe(204)
  })

  it('refuses a former company, and any other company', async () => {
    const former = await contactFor('hooli')
    const other = await contactFor('globex')

    for (const response of [
      await rename('hooli', former.token),
      await rename('acme', other.token),
    ]) {
      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({ code: 'auth/forbidden' })
    }
    expect(await read('companies/acme')).toMatchObject({ name: 'partner AS' })
  })

  it('answers 401 when signed out', async () => {
    const response = await rename('acme')

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ code: 'auth/signed-out' })
  })

  it('lets an admin set the contract', async () => {
    const { token } = await admin()

    expect((await rename('acme', token)).status).toBe(204)
    await expect
      .poll(() => read('companies/acme'))
      .toMatchObject({ cvAccess: true, type: 'main-partner' })
  })
})

describe('POST and DELETE /api/v1/company', () => {
  it('leaves creating and removing companies to admins', async () => {
    const { token } = await contactFor('acme')

    const created = await api('/api/v1/company', {
      method: 'POST',
      body: company('partner'),
      token,
    })
    const removed = await api('/api/v1/company', {
      method: 'DELETE',
      body: { companyUID: 'globex' },
      token,
    })

    expect([created.status, removed.status]).toEqual([403, 403])
    expect(await read('companies/globex')).not.toBeNull()
  })

  it('creates a company for an admin', async () => {
    const { token } = await admin()

    const response = await api('/api/v1/company', {
      method: 'POST',
      body: company('partner'),
      token,
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ companyUID: expect.any(String) })
  })
})

describe('GET /api/v1/company/events', () => {
  const list = (token: string, companyUID?: string) =>
    api(
      `/api/v1/company/events${companyUID ? `?companyUID=${companyUID}` : ''}`,
      { token },
    )

  it("lists a contact's own company's events", async () => {
    const { token } = await contactFor('acme')

    const response = await list(token, 'acme')

    expect(response.status).toBe(200)
    expect(Object.keys(response.body as object)).toEqual(['talk'])
  })

  it('lists only companies the caller manages events for', async () => {
    const { token } = await contactFor('acme')

    for (const response of [await list(token, 'globex'), await list(token)]) {
      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({ code: 'auth/forbidden' })
    }
  })

  it('lists every company for an admin', async () => {
    const { token } = await admin()

    const response = await list(token)

    expect(Object.keys(response.body as object).sort()).toEqual([
      'dinner',
      'talk',
    ])
  })
})
