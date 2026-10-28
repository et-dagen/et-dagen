import { deadlineOf, instantOf } from '@/lib/admin/time'
import type { EventRow } from '@/lib/admin/events'
import { search } from '@/lib/admin/listView'
import {
  afterDeadline,
  deadlineState,
  fairEventsOf,
  type DeadlineState,
  type FairEvent,
} from '@/lib/jobs'
import type { ISO8601String } from '@/domain/time'

/** What the job list reads from `jobs/<uid>`; every field may be missing */
export interface StoredJob {
  title?: string
  companyUID?: string
  jobType?: string
  location?: string
  deadline?: string
}

export interface JobRow {
  uid: string
  title: string
  companyUID: string
  company: string
  logo: string | null
  jobType: string | null
  location: string
  places: string[]
  deadline: string | undefined
  state: DeadlineState
  /** The company's next event at the fair before the deadline, where a student can meet them */
  nextEvent: FairEvent | null
}

/**
 * The places a location names, so "Bergen og Trondheim" counts for both
 *
 * @example placesOf('Bergen og Trondheim') // ['Bergen', 'Trondheim']
 */
export function placesOf(location: string | undefined): string[] {
  return (location ?? '')
    .split(/\s*(?:,|\/|\bog\b|\band\b|&)\s*/i)
    .map((place) => place.trim())
    .filter(Boolean)
}

/** The jobs still open for applications, nearest deadline first and those without one last */
export function jobRows(
  jobs: Record<string, StoredJob> | null | undefined,
  companies:
    | Record<string, { name?: string; logo?: string }>
    | null
    | undefined,
  events: Record<string, EventRow> | null | undefined,
  now: ISO8601String,
): JobRow[] {
  const closes = (row: JobRow) => instantOf(deadlineOf(row.deadline)) ?? '9999'
  return Object.entries(jobs ?? {})
    .map(([uid, job]): JobRow => {
      const company = companies?.[job.companyUID ?? '']
      return {
        uid,
        title: job.title ?? '',
        companyUID: job.companyUID ?? '',
        company: company?.name ?? '',
        logo: company?.logo ?? null,
        jobType: job.jobType ?? null,
        location: job.location ?? '',
        places: placesOf(job.location),
        deadline: job.deadline,
        state: deadlineState(job.deadline, now),
        // a meeting after the deadline is no stop on the way to applying
        nextEvent:
          fairEventsOf(job.companyUID, events, now).find(
            (event) => !afterDeadline(event, job.deadline),
          ) ?? null,
      }
    })
    .filter((row) => row.state.kind !== 'passed')
    .sort((a, b) => closes(a).localeCompare(closes(b)))
}

export interface JobFilters {
  query: string
  types: string[]
  companies: string[]
  places: string[]
  /** Only deadlines within the marked window */
  soon: boolean
}

type Group = 'types' | 'companies' | 'places' | 'soon'

const isSoon = (row: JobRow) => row.state.kind === 'open' && row.state.soon

function matches(row: JobRow, filters: JobFilters, skip?: Group): boolean {
  const any = (chosen: string[], values: (string | null)[]) =>
    chosen.length === 0 ||
    values.some((value) => value && chosen.includes(value))
  return (
    (skip === 'types' || any(filters.types, [row.jobType])) &&
    (skip === 'companies' || any(filters.companies, [row.companyUID])) &&
    (skip === 'places' || any(filters.places, row.places)) &&
    (skip === 'soon' || !filters.soon || isSoon(row))
  )
}

/** The rows matching every filter and every word of the search */
export function filterJobs(
  rows: readonly JobRow[],
  filters: JobFilters,
): JobRow[] {
  return search(
    rows.filter((row) => matches(row, filters)),
    filters.query,
    (row) => [row.title, row.company, row.location],
  )
}

export interface Facets {
  types: [string, number][]
  companies: [string, number][]
  places: [string, number][]
  soon: number
}

/**
 * How many rows each choice would show, given the other groups' choices, so a chip never
 * promises jobs that its click would hide
 *
 * @remarks
 * Every value any open job has stays listed, at 0 when nothing matches, and in a fixed order,
 * so chips neither vanish nor move while the student clicks.
 */
export function facetsOf(rows: readonly JobRow[], filters: JobFilters): Facets {
  const searched = search(rows, filters.query, (row) => [
    row.title,
    row.company,
    row.location,
  ])
  const count = (
    group: Group,
    chosen: string[],
    valuesOf: (row: JobRow) => (string | null)[],
  ): [string, number][] => {
    const counts = new Map<string, number>()
    for (const value of [...rows.flatMap(valuesOf), ...chosen]) {
      if (value) counts.set(value, 0)
    }
    for (const row of searched.filter((r) => matches(r, filters, group))) {
      for (const value of new Set(valuesOf(row))) {
        if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
      }
    }
    return [...counts].sort((a, b) => a[0].localeCompare(b[0], 'nb'))
  }
  return {
    types: count('types', filters.types, (row) => [row.jobType]),
    companies: count('companies', filters.companies, (row) => [row.companyUID]),
    places: count('places', filters.places, (row) => row.places),
    soon: searched.filter((row) => matches(row, filters, 'soon') && isSoon(row))
      .length,
  }
}
