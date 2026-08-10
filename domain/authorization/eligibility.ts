import type { StudentUser } from '@/domain/user'

/**
 * The attributes a rule is allowed to judge
 *
 * @remarks
 * Shaped to match the `Subject` the authorization layer carries, so a rule can be evaluated
 * against it without a translation step. Both fields are optional and `year` tolerates a
 * string, because the legacy RTDB records feed `studyProgram` and `currentYear` through
 * unchanged; an attribute that is missing or unparseable fails the rule rather than passing it.
 */
export interface Applicant {
  /** Programme uid */
  programme?: string
  year?: number | string
}

/**
 * Read a student from the domain as an applicant
 */
export const applicantOf = (
  student: Pick<StudentUser, 'programme' | 'year'>,
): Applicant => ({
  programme: student.programme.uid,
  year: student.year,
})

/**
 * A condition a student must meet to register for an event
 *
 * @remarks
 * Data rather than a predicate function, so a rule survives the trip through Firestore and the
 * server-rendered payload, can be shown in an admin UI, and can be compared between events.
 *
 * `every` and `some` nest, so "third-year students on either of two programmes" is expressible
 * without a dedicated variant. Programmes are referenced by uid, which is what a document can
 * hold and what stays stable if a programme is renamed.
 */
export type EligibilityRule =
  | { kind: 'programme'; programmes: string[] }
  | { kind: 'year'; years: number[] }
  | { kind: 'every'; rules: EligibilityRule[] }
  | { kind: 'some'; rules: EligibilityRule[] }

/**
 * Interpret a study year that may arrive as a number or a legacy string
 *
 * @returns The year, or null when it is absent or not a whole number
 */
const yearOf = (applicant: Applicant): number | null => {
  const { year } = applicant
  if (typeof year === 'number') return Number.isInteger(year) ? year : null
  if (typeof year === 'string' && /^\d+$/.test(year)) return Number(year)
  return null
}

/**
 * Check an applicant against a rule
 *
 * @remarks
 * An empty `every` passes and an empty `some` fails, following the usual reading of "all of
 * none" and "any of none". Prefer omitting the rule entirely to expressing "no restriction".
 */
export const satisfies = (
  rule: EligibilityRule,
  applicant: Applicant,
): boolean => {
  switch (rule.kind) {
    case 'programme':
      return (
        applicant.programme !== undefined &&
        rule.programmes.includes(applicant.programme)
      )
    case 'year': {
      const year = yearOf(applicant)
      return year !== null && rule.years.includes(year)
    }
    case 'every':
      return rule.rules.every((nested) => satisfies(nested, applicant))
    case 'some':
      return rule.rules.some((nested) => satisfies(nested, applicant))
  }
}
