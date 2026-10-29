/**
 * Who may manage jobs, and who may read, upload and delete résumés
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api, API_PORT } from '@/tests/api/support/api'
import {
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

const job = (companyUID: string) => ({
  companyUID,
  title: 'Summer job',
  description: 'Build things',
  deadline: '2999-01-01',
  jobType: 'summer',
  location: 'Trondheim',
  applicationLink: '',
  listing: 'text',
})
const contactFor = (companyUID: string) =>
  createUser({ userType: 'company', companyUID })
const admin = () => createUser({ userType: 'admin' })
const student = () =>
  createUser({ userType: 'basic', studyProgram: 'MTEL', currentYear: 3 })

beforeEach(async () => {
  await resetEmulators()
  await seed('companies', {
    acme: { name: 'Acme', type: 'partner', cvAccess: true },
    globex: { name: 'Globex', type: 'partner', cvAccess: false },
    initech: { name: 'Initech', type: 'sponsor', cvAccess: false },
  })
  await seed('jobs', { ours: job('acme'), theirs: job('globex') })
})

describe('jobs', () => {
  const create = (companyUID: string, token?: string) =>
    api('/api/v1/job', { method: 'POST', body: job(companyUID), token })
  const update = (jobUID: string, body: object, token: string) =>
    api('/api/v1/job', { method: 'PUT', body: { jobUID, ...body }, token })
  const remove = (jobUID: string, token: string) =>
    api(`/api/v1/job?jobUID=${jobUID}`, { method: 'DELETE', token })

  it("lets a contact manage their own company's jobs", async () => {
    const { token } = await contactFor('acme')

    expect((await create('acme', token)).status).toBe(201)
    expect((await update('ours', { title: 'New' }, token)).status).toBe(204)
    await expect.poll(() => read('jobs/ours/title')).toBe('New')
    expect((await remove('ours', token)).status).toBe(204)
  })

  it("lets a coordinator manage any company's jobs", async () => {
    const coordinator = await student()
    const given = { createdBy: 'test' }
    await seed(`roles/${coordinator.uid}`, { coordinator: given })
    await seed(`memberships/${coordinator.uid}/initech`, {
      kind: 'coordinator',
      ...given,
    })

    expect((await create('globex', coordinator.token)).status).toBe(201)
    expect(
      (await update('theirs', { title: 'New' }, coordinator.token)).status,
    ).toBe(204)
  })

  it('refuses another company, a sponsor and a student', async () => {
    const acme = await contactFor('acme')
    const refusals = [
      await create('globex', acme.token),
      await update('theirs', { title: 'New' }, acme.token),
      await remove('theirs', acme.token),
      await create('initech', (await contactFor('initech')).token),
      await create('acme', (await student()).token),
    ]

    for (const response of refusals) {
      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({ code: 'auth/forbidden' })
    }
    expect(await read('jobs/theirs/title')).toBe('Summer job')
  })

  it('answers 401 when signed out', async () => {
    const response = await create('acme')

    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ code: 'auth/signed-out' })
  })

  it('moves a job only for a caller who manages both companies', async () => {
    const contact = await contactFor('acme')
    await update('ours', { companyUID: 'globex' }, contact.token)
    await expect.poll(() => read('jobs/ours/companyUID')).toBe('acme')

    const { token } = await admin()
    await update('ours', { companyUID: 'globex' }, token)
    await expect.poll(() => read('jobs/ours/companyUID')).toBe('globex')
  })
})

describe('résumés', () => {
  const list = (token: string) => api('/api/v1/resume?scope=all', { token })
  const open = (userUID: string, token?: string) =>
    api(`/api/v1/resume/file?userUID=${userUID}`, { token })
  const upload = (userUID: string, token: string) => {
    const form = new FormData()
    form.append(
      'file',
      new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      'cv.pdf',
    )
    form.append('userUID', userUID)
    return fetch(`http://127.0.0.1:${API_PORT}/api/v1/resume`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form,
    })
  }
  const remove = (userUID: string, token: string) =>
    api('/api/v1/resume', { method: 'DELETE', body: { userUID }, token })

  it('lists every résumé only for a company with résumé access', async () => {
    const owner = await student()
    await seed(`users/${owner.uid}/resume`, 'https://example.com/not-ours.pdf')
    const withAccess = await contactFor('acme')
    const without = await contactFor('globex')

    expect(Array.isArray((await list(withAccess.token)).body)).toBe(true)
    expect((await list(without.token)).body).toMatchObject({
      companyUID: 'globex',
    })
    expect((await list(owner.token)).body).toMatchObject({ userType: 'basic' })
  })

  it("refuses opening someone else's résumé without résumé access", async () => {
    const owner = await student()
    const other = await student()
    const without = await contactFor('globex')

    for (const token of [other.token, without.token]) {
      const response = await open(owner.uid, token)
      expect(response.status).toBe(403)
      expect(response.body).toMatchObject({ code: 'auth/forbidden' })
    }
    expect((await open(owner.uid)).status).toBe(401)
  })

  it("refuses uploading or deleting someone else's résumé", async () => {
    const owner = await student()
    const other = await student()
    const contact = await contactFor('acme')

    expect((await upload(owner.uid, other.token)).status).toBe(403)
    expect((await upload(contact.uid, contact.token)).status).toBe(403)
    expect((await remove(owner.uid, other.token)).status).toBe(403)
  })

  it('answers 404 when deleting a résumé that does not exist', async () => {
    const { uid, token } = await student()

    expect((await remove(uid, token)).status).toBe(404)
  })
})
