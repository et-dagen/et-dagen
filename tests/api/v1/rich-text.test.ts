/**
 * Descriptions and links are cleaned before a page can show them, whether they arrive through the
 * API or were stored before the cleaning existed
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import {
  createUser,
  read,
  resetEmulators,
  seed,
} from '@/tests/api/support/emulators'

const SCRIPT =
  '<p onclick="steal()">Hei</p><script>steal()</script><img src=x onerror="steal()">'
const admin = { userType: 'admin' }

const job = {
  companyUID: 'c1',
  title: 'Engineer',
  description: '<p>Hei</p>',
  deadline: '2026-12-01',
  jobType: 'full-time',
  location: 'Trondheim',
  applicationLink: 'https://example.com/apply',
  listing: 'text',
}

beforeEach(resetEmulators)

describe('reading', () => {
  it('cleans stored job descriptions and drops script links', async () => {
    await seed('jobs', {
      j1: {
        ...job,
        description: SCRIPT,
        applicationLink: 'javascript:steal()',
      },
    })

    const { body } = await api('/api/v1/job?jobUID=j1')
    expect(body).toEqual({
      j1: { ...job, description: '<p>Hei</p>', applicationLink: '' },
    })
  })

  it('cleans stored event descriptions and map links', async () => {
    await seed('events', {
      e1: {
        title: 'Talk',
        description: SCRIPT,
        location: { name: 'EL5', map: 'javascript:steal()' },
      },
    })

    const { body } = await api('/api/v1/event')
    expect(body).toEqual({
      e1: {
        title: 'Talk',
        description: '<p>Hei</p>',
        location: { name: 'EL5', map: null },
      },
    })
  })

  it('drops a company website that is not a web address', async () => {
    await seed('companies', {
      c1: { name: 'Polarbit', webpage: 'javascript:steal()' },
    })

    expect((await api('/api/v1/company')).body).toEqual({
      c1: { name: 'Polarbit', webpage: '', tier: 'prior' },
    })
  })
})

describe('writing', () => {
  it('refuses a job link that is not http(s) and stores a cleaned description', async () => {
    await seed('companies', {
      c1: { name: 'Polarbit', webpage: 'https://example.com' },
    })
    const { token } = await createUser(admin)

    const refused = await api('/api/v1/job', {
      method: 'POST',
      token,
      body: { ...job, applicationLink: 'javascript:steal()' },
    })
    expect(refused.status).toBe(400)

    const created = await api('/api/v1/job', {
      method: 'POST',
      token,
      body: { ...job, description: SCRIPT },
    })
    expect(created.status).toBe(201)
    const stored = Object.values(
      (await read('jobs')) as Record<string, typeof job>,
    )
    expect(stored.map((j) => j.description)).toEqual(['<p>Hei</p>'])
  })

  it('refuses a company website that is not http(s)', async () => {
    const { token } = await createUser(admin)

    const refused = await api('/api/v1/company', {
      method: 'POST',
      token,
      body: {
        name: 'Polarbit',
        type: 'partner',
        webpage: 'javascript:steal()',
      },
    })
    expect(refused.status).toBe(400)
  })
})
