import type { Brand } from '@/domain/brand'
import { UUIDv4 } from '@/domain/uuid'

/**
 * Identifies a study programme in the list
 *
 * @remarks
 * Programmes stored before the admin page have the keys "0", "1", ...; new ones get a random UUID.
 * Students store the programme's name, not this id.
 */
export type ProgrammeId = Brand<string, 'ProgrammeId'>

export const ProgrammeId = {
  /** @throws RangeError when the value is empty */
  parse: (value: string): ProgrammeId => {
    if (value.length === 0) throw new RangeError('Programme id is empty')
    return value as ProgrammeId
  },
  random: (): ProgrammeId => UUIDv4.random() as string as ProgrammeId,
}

/**
 * What kind of degree a programme leads to, which decides the years it offers
 *
 * @remarks
 * Years count from the start of a five-year degree: a bachelor runs 1 to 3, a master 4 and 5, and
 * an integrated master all five.
 */
export const DEGREES = ['bachelor', 'master', 'integrated'] as const
export type Degree = (typeof DEGREES)[number]

/** A study programme students choose from */
export interface Programme {
  id: ProgrammeId
  name: string
  degree: Degree
  /**
   * Whether new students can choose it
   *
   * @remarks
   * A programme that is no longer offered is closed rather than removed, so the students who have
   * it keep a programme the forms know.
   */
  open: boolean
}

/** What an admin fills in for a programme */
export type ProgrammeInput = Omit<Programme, 'id'>

export type ProgrammeInputProblem =
  | 'programme/invalid-name'
  | 'programme/invalid-degree'

const MAX_NAME = 120

/** A programme's details from a request, or the first problem with them */
export function checkedProgrammeInput(
  raw: unknown,
): ProgrammeInput | { problem: ProgrammeInputProblem } {
  const body = (raw ?? {}) as Record<string, unknown>
  const name =
    typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''
  if (name.length === 0 || name.length > MAX_NAME) {
    return { problem: 'programme/invalid-name' }
  }
  if (!(DEGREES as readonly unknown[]).includes(body.degree)) {
    return { problem: 'programme/invalid-degree' }
  }
  return { name, degree: body.degree as Degree, open: body.open !== false }
}

/** Whether two names would read as the same programme in a list */
export const sameName = (a: string, b: string) =>
  a.localeCompare(b, 'nb', { sensitivity: 'base' }) === 0
