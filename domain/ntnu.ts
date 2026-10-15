import type { Brand } from '@/domain/brand'
import type { ISO8601String } from '@/domain/time/instant'

type BachelorProgramme = {
  kind: 'bachelor'
  duration: 3
  years: [1, 2, 3]
}

type MasterProgramme = {
  kind: 'master'
  duration: 2
  years: [1, 2]
}

type IntegratedMasterProgramme = {
  kind: 'integratedMaster'
  duration: 5
  years: [1, 2, 3, 4, 5]
}

export type ProgrammeType =
  | BachelorProgramme
  | MasterProgramme
  | IntegratedMasterProgramme

/**
 * A year a student can be in
 *
 * @remarks
 * Derived from the programme definitions rather than restated, so adding a programme with a
 * different length widens this automatically instead of leaving the two to drift apart.
 */
export type StudyYear = ProgrammeType['years'][number]

export interface StudyProgramme {
  uid: string
  name: string
  type: ProgrammeType
}

export type Season = 'spring' | 'autumn'
export type TermLiteral = `${number}-${Season}`

/**
 * A semester, written `2027-spring` or `2027-autumn`
 *
 * @remarks
 * Stored instead of a study year, because a year goes stale every August and cannot express a
 * student who is half a year behind. The year is derived from this and the programme length.
 */
export type Term = Brand<TermLiteral, 'Term'>

const TERM = /^\d{4}-(spring|autumn)$/

/** Terms as consecutive integers, so two terms can be subtracted */
const ordinal = (term: Term): number =>
  Number(term.slice(0, 4)) * 2 + (term.endsWith('autumn') ? 1 : 0)

export const Term = {
  is: (value: unknown): value is Term =>
    typeof value === 'string' && TERM.test(value),
  parse: (value: string): Term => {
    if (!Term.is(value)) throw new RangeError(`Not a term: ${value}`)
    return value
  },
  tryParse: (value: string): Term | null => (Term.is(value) ? value : null),
  /** The term an instant falls in: January to June is spring, July to December autumn */
  at: (instant: ISO8601String): Term =>
    `${instant.slice(0, 4)}-${Number(instant.slice(5, 7)) <= 6 ? 'spring' : 'autumn'}` as Term,
  /** Negative when `a` comes first, zero when equal, positive when `a` comes later */
  compare: (a: Term, b: Term): number => ordinal(a) - ordinal(b),
} as const

/**
 * The study year of a student expected to graduate at the end of `graduation`
 *
 * @remarks
 * Counts the terms left including the current one, and rounds up to whole years, so a student
 * half a year behind reads as the lower year until they catch up.
 *
 * @returns The year, or null when `now` falls outside the programme (not started or finished)
 */
export const yearAt = (
  type: ProgrammeType,
  graduation: Term,
  now: ISO8601String,
): StudyYear | null => {
  const termsLeft = Term.compare(graduation, Term.at(now)) + 1
  const year = type.duration - Math.ceil(termsLeft / 2) + 1
  return (type.years as readonly number[]).includes(year)
    ? (year as StudyYear)
    : null
}
