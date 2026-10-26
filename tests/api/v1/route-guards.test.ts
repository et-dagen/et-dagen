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
  it("open the company pages to a partner's contact", async () => {
    const { token } = await contactFor('acme')

    expect((await page('/company/admin', token)).status).toBe(200)
    expect((await page('/jobs/edit', token)).status).toBe(200)
  })

  it('send a sponsor and a student to their profile', async () => {
    const sponsor = await contactFor('initech')
    const student = await createUser({
      userType: 'basic',
      studyProgram: 'MTEL',
      currentYear: 3,
    })

    for (const token of [sponsor.token, student.token]) {
      const response = await page('/company/admin', token)
      expect(response.status).toBe(302)
      expect(response.location).toBe('/user')
    }
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
