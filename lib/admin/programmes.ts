import type { Degree } from '@/domain/fair/programme'

/** A programme as the admin page lists it */
export interface ProgrammeRow {
  code: string
  name: string
  degree: Degree
  open: boolean
}

type Stored = { name?: string; type?: string; closed?: boolean } | string | null

const DEGREE_TYPES: readonly string[] = ['bachelor', 'master', 'integrated']

/**
 * The programmes `GET /api/v1/programme` answers with, by name and then code
 *
 * @remarks
 * Reads old records as the server does: a bare name, or a type it does not know, is an
 * integrated master.
 */
export function programmeRows(
  data: Record<string, Stored> | null | undefined,
): ProgrammeRow[] {
  return Object.entries(data ?? {})
    .flatMap(([code, stored]) => {
      const fields = typeof stored === 'string' ? { name: stored } : stored
      if (!fields?.name) return []
      const degree = DEGREE_TYPES.includes(fields.type ?? '')
        ? (fields.type as Degree)
        : 'integrated'
      return [{ code, name: fields.name, degree, open: fields.closed !== true }]
    })
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name, 'nb') || a.code.localeCompare(b.code),
    )
}

/** A stored wall-clock time as a `datetime-local` field shows it, without seconds */
export const fieldTime = (stored: string | undefined) =>
  stored ? stored.slice(0, 16) : ''
