/**
 * Pins what the public, read-only endpoints answer today. They need no sign-in.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '@/tests/api/support/api'
import { resetEmulators, seed } from '@/tests/api/support/emulators'

beforeEach(resetEmulators)

const empty = { status: 204, body: undefined }

describe('GET /api/v1/programme', () => {
  it('returns the study programmes keyed by uid', async () => {
    const studyProgrammes = { mtel: { name: 'MTEL', years: [1, 2, 3, 4, 5] } }
    await seed('studyProgrammes', studyProgrammes)

    expect(await api('/api/v1/programme')).toEqual({
      status: 200,
      body: studyProgrammes,
    })
  })

  it('answers 204 when there are none', async () => {
    expect(await api('/api/v1/programme')).toEqual(empty)
  })
})

describe('GET /api/v1/generalInfo', () => {
  it('returns the general info node as stored', async () => {
    const generalInfo = { date: '2027-02-10', place: 'Gløshaugen' }
    await seed('generalInfo', generalInfo)

    expect(await api('/api/v1/generalInfo')).toEqual({
      status: 200,
      body: generalInfo,
    })
  })
})

describe('GET /api/v1/company', () => {
  const companies = {
    acme: { name: 'Acme', type: 'main', webpage: 'https://acme.example' },
    globex: {
      name: 'Globex',
      type: 'standard',
      webpage: 'https://globex.example',
    },
  }

  it('lists every company keyed by uid', async () => {
    await seed('companies', companies)
    // types v1 doesn't know read as a former company
    expect(await api('/api/v1/company')).toEqual({
      status: 200,
      body: {
        acme: { ...companies.acme, tier: 'prior' },
        globex: { ...companies.globex, tier: 'prior' },
      },
    })
  })

  it('returns one company as a single-entry map', async () => {
    await seed('companies', companies)
    expect(await api('/api/v1/company?companyUID=acme')).toEqual({
      status: 200,
      body: { acme: { ...companies.acme, tier: 'prior' } },
    })
  })

  it('answers 204 for an unknown company, not 404', async () => {
    expect(await api('/api/v1/company?companyUID=missing')).toEqual(empty)
  })
})

describe('GET /api/v1/job', () => {
  const jobs = {
    j1: { companyUID: 'acme', title: 'Summer intern', jobType: 'summer' },
  }

  it('lists every job keyed by uid', async () => {
    await seed('jobs', jobs)
    expect(await api('/api/v1/job')).toEqual({ status: 200, body: jobs })
  })

  it('returns one job as a single-entry map', async () => {
    await seed('jobs', jobs)
    expect(await api('/api/v1/job?jobUID=j1')).toEqual({
      status: 200,
      body: jobs,
    })
  })

  it('answers 204 for an unknown job, not 404', async () => {
    expect(await api('/api/v1/job?jobUID=missing')).toEqual(empty)
  })
})

describe('GET /api/v1/code/:code', () => {
  it('says whether a registration code exists, and nothing more', async () => {
    await seed('registrationCodes', {
      k1: { code: 'acme-abcdefgh', companyUID: 'acme' },
    })

    expect(await api('/api/v1/code/acme-abcdefgh')).toEqual({
      status: 200,
      body: { isValid: true },
    })
    expect(await api('/api/v1/code/acme-wrong')).toEqual({
      status: 200,
      body: { isValid: false },
    })
  })
})
