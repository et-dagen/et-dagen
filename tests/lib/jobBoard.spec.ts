import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time'
import {
  facetsOf,
  filterJobs,
  jobRows,
  placesOf,
  type JobFilters,
} from '@/lib/jobBoard'

// 12:00 in Oslo on 1 November 2026
const now = Instant.parse('2026-11-01T11:00:00.000Z')

const jobs = {
  late: {
    title: 'Data engineer',
    companyUID: 'c2',
    jobType: 'full-time',
    location: 'Bergen og Trondheim',
    deadline: '2026-12-10',
  },
  soon: {
    title: 'Graduate engineer',
    companyUID: 'c1',
    jobType: 'graduate',
    location: 'Oslo',
    deadline: '2026-11-08',
  },
  gone: {
    title: 'Old job',
    companyUID: 'c1',
    jobType: 'full-time',
    location: 'Oslo',
    deadline: '2026-10-01',
  },
  open: {
    title: 'Summer intern',
    companyUID: 'c1',
    jobType: 'summer-internship',
    location: 'Trondheim',
  },
}
const companies = {
  c1: { name: 'Polarbit AS' },
  c2: { name: 'Tindra Semiconductors' },
}
const events = {
  e1: {
    companyUID: 'c1',
    title: 'Presentasjon',
    date: { start: '2026-11-04T17:15', end: '2026-11-04T19:00' },
  },
}
const rows = jobRows(jobs, companies, events, now)
const none: JobFilters = {
  query: '',
  types: [],
  companies: [],
  places: [],
  soon: false,
}

describe('placesOf', () => {
  it('splits a location into its places', () => {
    expect(placesOf('Bergen og Trondheim')).toEqual(['Bergen', 'Trondheim'])
    expect(placesOf('Oslo, Bergen / Stavanger')).toEqual([
      'Oslo',
      'Bergen',
      'Stavanger',
    ])
    expect(placesOf(undefined)).toEqual([])
  })
})

describe('jobRows', () => {
  it('leaves out passed jobs and puts the nearest deadline first, none last', () => {
    expect(rows.map((row) => row.uid)).toEqual(['soon', 'late', 'open'])
  })

  it('joins the company and its next event at the fair', () => {
    expect(rows[0]).toMatchObject({
      company: 'Polarbit AS',
      nextEvent: { uid: 'e1' },
    })
    expect(rows[1]!.nextEvent).toBeNull()
  })

  it('leaves out an event that comes after the deadline', () => {
    const [row] = jobRows(
      { early: { ...jobs.soon, deadline: '2026-11-02' } },
      companies,
      events,
      now,
    )
    expect(row!.nextEvent).toBeNull()
  })
})

describe('filterJobs', () => {
  it('keeps rows matching every group and the search', () => {
    expect(
      filterJobs(rows, { ...none, places: ['Trondheim'] }).map((r) => r.uid),
    ).toEqual(['late', 'open'])
    expect(
      filterJobs(rows, { ...none, companies: ['c1'], soon: true }).map(
        (r) => r.uid,
      ),
    ).toEqual(['soon'])
    expect(
      filterJobs(rows, { ...none, query: 'tindra' }).map((r) => r.uid),
    ).toEqual(['late'])
  })
})

describe('facetsOf', () => {
  it("counts each choice under the other groups' choices", () => {
    const facets = facetsOf(rows, { ...none, companies: ['c1'] })
    expect(facets.companies).toEqual([
      ['c1', 2],
      ['c2', 1],
    ])
    expect(facets.places).toEqual([
      ['Bergen', 0],
      ['Oslo', 1],
      ['Trondheim', 1],
    ])
    expect(facets.soon).toBe(1)
  })

  it('keeps every value, and a chosen one, when a search matches nothing', () => {
    const facets = facetsOf(rows, {
      ...none,
      query: 'zzz',
      types: ['graduate'],
    })
    expect(facets.types).toEqual([
      ['full-time', 0],
      ['graduate', 0],
      ['summer-internship', 0],
    ])
  })
})
