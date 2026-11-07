import type { Brand } from '@/domain/brand'

/**
 * A study programme's code, as NTNU gives it (`MTELSYS`, `MTIØT`): unique, and the programme's key
 *
 * @remarks
 * Names may repeat (a bachelor and a master can share one), so students and events point at a
 * programme by its code. Codes do not change. Programmes stored before codes have the keys "0",
 * "1", ... until they are given codes, so `parse` takes any stored key; new codes go through
 * {@link ProgrammeCode.tryParse}.
 */
export type ProgrammeCode = Brand<string, 'ProgrammeCode'>

const CODE = /^[A-ZÆØÅ][A-ZÆØÅ0-9]{1,19}$/

export const ProgrammeCode = {
  /** A stored key; @throws RangeError when it is empty */
  parse: (value: string): ProgrammeCode => {
    if (value.length === 0) throw new RangeError('Programme code is empty')
    return value as ProgrammeCode
  },
  /** A new code: a letter, then letters (Æ, Ø and Å too) and digits, 2 to 20 in all; read in capitals */
  tryParse: (value: string): ProgrammeCode | null => {
    const code = value.trim().toUpperCase()
    return CODE.test(code) ? (code as ProgrammeCode) : null
  },
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
  code: ProgrammeCode
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

/** What an admin may change about a programme; the code stays */
export type ProgrammeDetails = Omit<Programme, 'code'>

export type ProgrammeInputProblem =
  | 'programme/invalid-code'
  | 'programme/invalid-name'
  | 'programme/invalid-degree'

const MAX_NAME = 120

/** A programme's details from a request, or the first problem with them */
export function checkedProgrammeDetails(
  raw: unknown,
): ProgrammeDetails | { problem: ProgrammeInputProblem } {
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

/** A new programme from a request: a code and its details, or the first problem */
export function checkedNewProgramme(
  raw: unknown,
): Programme | { problem: ProgrammeInputProblem } {
  const body = (raw ?? {}) as Record<string, unknown>
  const code =
    typeof body.code === 'string' ? ProgrammeCode.tryParse(body.code) : null
  if (!code) return { problem: 'programme/invalid-code' }
  const details = checkedProgrammeDetails(raw)
  return 'problem' in details ? details : { code, ...details }
}
