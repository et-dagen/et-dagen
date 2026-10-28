/**
 * The route guards answer like the server: pages render for whoever the permission table lets in,
 * and redirect everyone else
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { API_PORT } from '@/tests/api/support/api'
import { createUser, resetEmulators, seed } from '@/tests/api/support/emulators'

/** Request a page as a browser would, without following a redirect */
const page = async (path: string, token?: string) => {
  const response = await fetch(`http://127.0.0.1:${API_PORT}${path}`, {
    redirect: 'manual',
    headers: {
      accept: 'text/html',
      ...(token && { authorization: `Bearer ${token}` }),
    },
  })
  return {
    status: response.status,
    location: response.headers.get('location'),
  }
}
const contactFor = (companyUID: string) =>
  createUser({ userType: 'company', companyUID })

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner', cvAccess: false },
    initech: { name: 'Initech', type: 'sponsor', cvAccess: false },
  })
})

describe('route guards', () => {
  it("open the company pages to a partner's contact, but not event editing", async () => {
    const { token } = await contactFor('acme')

    expect((await page('/company/admin', token)).status).toBe(200)
    expect((await page('/company/admin/jobs', token)).status).toBe(200)
    expect((await page('/company/admin/events/new', token)).location).toBe(
      '/user',
    )
  })

  it('list the events of every company a coordinator manages', async () => {
    const { uid, token } = await createUser({
      userType: 'basic',
      studyProgram: 'MTEL',
      currentYear: 3,
    })
    const given = { createdBy: 'test' }
    await seed(`roles/${uid}`, { coordinator: given })
    await seed(`memberships/${uid}`, {
      acme: { kind: 'coordinator' },
      globex: { kind: 'coordinator' },
    })
    await seed('companies/globex', { name: 'Globex', type: 'partner' })
    await seed('events', {
      talk: { title: 'Acme talk', companyUID: 'acme' },
      dinner: { title: 'Globex dinner', companyUID: 'globex' },
      fair: { title: 'Initech fair', companyUID: 'initech' },
    })

    const html = await (
      await fetch(`http://127.0.0.1:${API_PORT}/company/admin`, {
        headers: { accept: 'text/html', authorization: `Bearer ${token}` },
      })
    ).text()

    expect(html).toContain('Acme talk')
    expect(html).toContain('Globex dinner')
    expect(html).not.toContain('Initech fair')
  })

  it("open a sponsor's contact its events, but not the jobs", async () => {
    const { token } = await contactFor('initech')

    expect((await page('/company/admin', token)).status).toBe(200)
    expect((await page('/company/admin/jobs', token)).location).toBe('/user')
  })

  it('send a student to their profile', async () => {
    const student = await createUser({
      userType: 'basic',
      studyProgram: 'MTEL',
      currentYear: 3,
    })

    const response = await page('/company/admin', student.token)
    expect(response.status).toBe(302)
    expect(response.location).toBe('/user')
  })

  it('keep the admin panel to admins', async () => {
    const contact = await contactFor('acme')
    const admin = await createUser({ userType: 'admin' })

    expect((await page('/admin/companies', contact.token)).location).toBe(
      '/user',
    )
    expect((await page('/admin/companies', admin.token)).status).toBe(200)
  })

  it('send a signed-out visitor to sign in', async () => {
    expect((await page('/company/admin')).location).toBe('/user/signin')
  })
})
