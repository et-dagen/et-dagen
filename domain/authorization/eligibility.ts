import { Term, yearAt, type StudyYear } from '@/domain/ntnu'
import type { ISO8601String } from '@/domain/time/instant'
import type { StudentUser } from '@/domain/user'

/**
 * The attributes a rule is allowed to judge
 *
 * @remarks
 * Every field is required. A user without a student profile, or outside their programme, has
 * no applicant at all, and `satisfies` refuses them before looking at the rule. That keeps
 * `not` safe: inside the tree an attribute is never missing, so negation cannot turn "unknown"
 * into "allowed".
 */
export interface Applicant {
  /** Programme uid */
  programme: string
  year: StudyYear
  graduation: Term
}

/**
 * Read a student from the domain as an applicant
 *
 * @returns The applicant, or null when the student is not enrolled at `now`
 */
export const applicantOf = (
  student: Pick<StudentUser, 'programme' | 'expectedGraduation'>,
  now: ISO8601String,
): Applicant | null => {
  const year = yearAt(student.programme.type, student.expectedGraduation, now)
  return year === null
    ? null
    : {
        programme: student.programme.uid,
        year,
        graduation: student.expectedGraduation,
      }
}

/**
 * A condition a student must meet to register for an event, or to be recommended for a job
 *
 * @remarks
 * Data rather than a predicate function, so a rule survives storage and the server-rendered
 * payload, can be shown in an admin UI, and can be compared between events.
 *
 * `and`, `or` and `not` nest, so any boolean combination of the leaves is expressible.
 * Programmes are referenced by uid, which stays stable if a programme is renamed. A
 * `graduation` range may be open at either end, but not both.
 */
export type EligibilityRule =
  | { kind: 'programme'; programmes: string[] }
  | { kind: 'year'; years: StudyYear[] }
  | { kind: 'graduation'; from?: Term; to?: Term }
  | { kind: 'and'; rules: EligibilityRule[] }
  | { kind: 'or'; rules: EligibilityRule[] }
  | { kind: 'not'; rule: EligibilityRule }

/**
 * A rule as stored
 *
 * @remarks
 * The rule sits in a JSON column the database cannot check, so the version is the only way a
 * later change to the format can be migrated safely.
 */
export interface StoredEligibility {
  v: 1
  rule: EligibilityRule
}

/**
 * The outcome of checking an applicant
 *
 * @remarks
 * `unmet` is the rule pruned to the part that failed, for the UI to render as a reason: an `and`
 * keeps only its failing children, an `or` keeps every alternative because all of them failed,
 * and a `not` returns itself. The domain returns data, not text, so rendering stays with i18n.
 */
export type Verdict =
  | { ok: true }
  | { ok: false; reason: 'notEnrolled' }
  | { ok: false; reason: 'unmet'; unmet: EligibilityRule }

const inRange = (term: Term, from?: Term, to?: Term): boolean =>
  (!from || Term.compare(term, from) >= 0) &&
  (!to || Term.compare(term, to) <= 0)

/**
 * The smallest part of `rule` the applicant fails, or null when they meet it
 */
const unmetPart = (
  rule: EligibilityRule,
  applicant: Applicant,
): EligibilityRule | null => {
  switch (rule.kind) {
    case 'programme':
      return rule.programmes.includes(applicant.programme) ? null : rule
    case 'year':
      return rule.years.includes(applicant.year) ? null : rule
    case 'graduation':
      return inRange(applicant.graduation, rule.from, rule.to) ? null : rule
    case 'and': {
      const failed = rule.rules
        .map((nested) => unmetPart(nested, applicant))
        .filter((nested): nested is EligibilityRule => nested !== null)
      if (failed.length === 0) return null
      return failed.length === 1 ? failed[0] : { kind: 'and', rules: failed }
    }
    case 'or': {
      const failed: EligibilityRule[] = []
      for (const nested of rule.rules) {
        const unmet = unmetPart(nested, applicant)
        if (unmet === null) return null
        failed.push(unmet)
      }
      return { kind: 'or', rules: failed }
    }
    case 'not':
      return unmetPart(rule.rule, applicant) === null ? rule : null
  }
}

/**
 * Check an applicant against a rule
 */
export const satisfies = (
  rule: EligibilityRule,
  applicant: Applicant | null,
): Verdict => {
  if (!applicant) return { ok: false, reason: 'notEnrolled' }
  const unmet = unmetPart(rule, applicant)
  return unmet ? { ok: false, reason: 'unmet', unmet } : { ok: true }
}

/** Deepest nesting a rule may have, counting the root as 1 */
export const MAX_DEPTH = 4
/** Most nodes a rule may have, leaves and groups together */
export const MAX_NODES = 32

export type RuleErrorCode =
  | 'unsupportedVersion'
  | 'malformed'
  | 'unknownKind'
  | 'emptyGroup'
  | 'emptyList'
  | 'invalidYear'
  | 'invalidTerm'
  | 'emptyRange'
  | 'invertedRange'
  | 'tooDeep'
  | 'tooLarge'

/**
 * Why a stored rule was rejected
 *
 * @remarks
 * `path` points at the offending node, such as `rule.rules[1].rule`, so an editor can mark it.
 */
export interface RuleError {
  code: RuleErrorCode
  path: string
}

export type ParsedEligibility =
  | { ok: true; value: StoredEligibility }
  | { ok: false; errors: RuleError[] }

const STUDY_YEARS: readonly unknown[] = [1, 2, 3, 4, 5]

interface Walk {
  errors: RuleError[]
  nodes: number
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const nonEmptyList = (
  value: unknown,
  path: string,
  walk: Walk,
): unknown[] | null => {
  if (!Array.isArray(value)) {
    walk.errors.push({ code: 'malformed', path })
    return null
  }
  if (value.length === 0) {
    walk.errors.push({ code: 'emptyList', path })
    return null
  }
  return value
}

/** Undefined when absent, null when present but invalid */
const optionalTerm = (
  value: unknown,
  path: string,
  walk: Walk,
): Term | undefined | null => {
  if (value === undefined) return undefined
  if (Term.is(value)) return value
  walk.errors.push({ code: 'invalidTerm', path })
  return null
}

const parseGraduation = (
  raw: Record<string, unknown>,
  path: string,
  walk: Walk,
): EligibilityRule | null => {
  const from = optionalTerm(raw.from, `${path}.from`, walk)
  const to = optionalTerm(raw.to, `${path}.to`, walk)
  if (from === null || to === null) return null
  if (!from && !to) {
    walk.errors.push({ code: 'emptyRange', path })
    return null
  }
  if (from && to && Term.compare(from, to) > 0) {
    walk.errors.push({ code: 'invertedRange', path })
    return null
  }
  return { kind: 'graduation', ...(from && { from }), ...(to && { to }) }
}

const parseGroup = (
  kind: 'and' | 'or',
  raw: Record<string, unknown>,
  path: string,
  depth: number,
  walk: Walk,
): EligibilityRule | null => {
  if (!Array.isArray(raw.rules)) {
    walk.errors.push({ code: 'malformed', path: `${path}.rules` })
    return null
  }
  if (raw.rules.length === 0) {
    walk.errors.push({ code: 'emptyGroup', path })
    return null
  }
  const rules = raw.rules.map((nested, index) =>
    parseRule(nested, `${path}.rules[${index}]`, depth + 1, walk),
  )
  return rules.every((nested) => nested !== null)
    ? { kind, rules: rules as EligibilityRule[] }
    : null
}

const parseRule = (
  raw: unknown,
  path: string,
  depth: number,
  walk: Walk,
): EligibilityRule | null => {
  walk.nodes += 1
  if (depth > MAX_DEPTH) {
    walk.errors.push({ code: 'tooDeep', path })
    return null
  }
  if (!isRecord(raw) || typeof raw.kind !== 'string') {
    walk.errors.push({ code: 'malformed', path })
    return null
  }

  switch (raw.kind) {
    case 'programme': {
      const programmes = nonEmptyList(
        raw.programmes,
        `${path}.programmes`,
        walk,
      )
      if (!programmes) return null
      if (!programmes.every((uid) => typeof uid === 'string' && uid !== '')) {
        walk.errors.push({ code: 'malformed', path: `${path}.programmes` })
        return null
      }
      return { kind: 'programme', programmes: programmes as string[] }
    }
    case 'year': {
      const years = nonEmptyList(raw.years, `${path}.years`, walk)
      if (!years) return null
      if (!years.every((year) => STUDY_YEARS.includes(year))) {
        walk.errors.push({ code: 'invalidYear', path: `${path}.years` })
        return null
      }
      return { kind: 'year', years: years as StudyYear[] }
    }
    case 'graduation':
      return parseGraduation(raw, path, walk)
    case 'and':
    case 'or':
      return parseGroup(raw.kind, raw, path, depth, walk)
    case 'not': {
      const rule = parseRule(raw.rule, `${path}.rule`, depth + 1, walk)
      return rule && { kind: 'not', rule }
    }
    default:
      walk.errors.push({ code: 'unknownKind', path })
      return null
  }
}

/**
 * Validate a stored rule
 *
 * @remarks
 * The only way into the domain for a rule, whether it comes from the database or an editor.
 * Collects every error instead of stopping at the first, so an editor can fix them in one pass.
 * Programme uids are checked only for shape; whether they exist is for the caller to ask the
 * programme repository, since a JSON column cannot hold a foreign key.
 */
export const parseEligibility = (raw: unknown): ParsedEligibility => {
  if (!isRecord(raw)) {
    return { ok: false, errors: [{ code: 'malformed', path: '' }] }
  }
  if (raw.v !== 1) {
    return { ok: false, errors: [{ code: 'unsupportedVersion', path: 'v' }] }
  }
  const walk: Walk = { errors: [], nodes: 0 }
  const rule = parseRule(raw.rule, 'rule', 1, walk)
  if (walk.nodes > MAX_NODES) {
    walk.errors.push({ code: 'tooLarge', path: 'rule' })
  }
  return rule && walk.errors.length === 0
    ? { ok: true, value: { v: 1, rule } }
    : { ok: false, errors: walk.errors }
}
