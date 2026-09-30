import { describe, expect, it } from 'vitest'
import {
  applicantOf,
  MAX_DEPTH,
  MAX_NODES,
  parseEligibility,
  satisfies,
  type Applicant,
  type EligibilityRule,
} from '~/domain/authorization/eligibility'
import { Term, type StudyProgramme, type StudyYear } from '@/domain/ntnu'
import { Instant } from '@/domain/time/instant'

const term = (value: string) => Term.parse(value)

const applicant = (overrides: Partial<Applicant> = {}): Applicant => ({
  programme: 'mtdt',
  year: 4,
  graduation: term('2028-spring'),
  ...overrides,
})

const programme = (...programmes: string[]): EligibilityRule => ({
  kind: 'programme',
  programmes,
})
const year = (...years: StudyYear[]): EligibilityRule => ({
  kind: 'year',
  years,
})

describe('leaves', () => {
  it('matches any listed programme', () => {
    expect(satisfies(programme('mtdt', 'mtkom'), applicant())).toEqual({
      ok: true,
    })
    expect(
      satisfies(programme('mtkom'), applicant({ programme: 'mtiot' })),
    ).toEqual({ ok: false, reason: 'unmet', unmet: programme('mtkom') })
  })

  it('matches any listed year', () => {
    expect(satisfies(year(4, 5), applicant())).toEqual({ ok: true })
    expect(satisfies(year(5), applicant()).ok).toBe(false)
  })

  it('matches a graduation range inclusively, open at either end', () => {
    const range: EligibilityRule = {
      kind: 'graduation',
      from: term('2027-autumn'),
      to: term('2028-spring'),
    }
    expect(satisfies(range, applicant()).ok).toBe(true)
    expect(
      satisfies(range, applicant({ graduation: term('2027-autumn') })).ok,
    ).toBe(true)
    expect(
      satisfies(range, applicant({ graduation: term('2028-autumn') })).ok,
    ).toBe(false)

    const until: EligibilityRule = {
      kind: 'graduation',
      to: term('2027-spring'),
    }
    expect(satisfies(until, applicant()).ok).toBe(false)
    expect(
      satisfies(until, applicant({ graduation: term('2026-autumn') })).ok,
    ).toBe(true)
  })
})

describe('operators', () => {
  it('requires every child under and, reporting only the failing ones', () => {
    const rule: EligibilityRule = {
      kind: 'and',
      rules: [programme('mtdt'), year(5), programme('mtdt', 'mtkom')],
    }
    expect(satisfies(rule, applicant({ year: 5 })).ok).toBe(true)
    expect(satisfies(rule, applicant())).toEqual({
      ok: false,
      reason: 'unmet',
      unmet: year(5),
    })
    expect(satisfies(rule, applicant({ programme: 'mtiot' }))).toEqual({
      ok: false,
      reason: 'unmet',
      unmet: {
        kind: 'and',
        rules: [programme('mtdt'), year(5), programme('mtdt', 'mtkom')],
      },
    })
  })

  it('accepts any child under or, reporting every alternative when all fail', () => {
    const rule: EligibilityRule = {
      kind: 'or',
      rules: [programme('mtkom'), year(5)],
    }
    expect(satisfies(rule, applicant({ year: 5 })).ok).toBe(true)
    expect(satisfies(rule, applicant())).toEqual({
      ok: false,
      reason: 'unmet',
      unmet: rule,
    })
  })

  it('inverts under not, reporting the not itself', () => {
    const rule: EligibilityRule = { kind: 'not', rule: programme('mtdt') }
    expect(satisfies(rule, applicant({ programme: 'mtiot' })).ok).toBe(true)
    expect(satisfies(rule, applicant())).toEqual({
      ok: false,
      reason: 'unmet',
      unmet: rule,
    })
  })

  it('prunes nested failures down to the part that failed', () => {
    // Year 4–5 on MTDT or anyone graduating in 2027, but not MTKOM.
    const in2027: EligibilityRule = {
      kind: 'graduation',
      from: term('2027-spring'),
      to: term('2027-autumn'),
    }
    const rule: EligibilityRule = {
      kind: 'and',
      rules: [
        {
          kind: 'or',
          rules: [
            { kind: 'and', rules: [programme('mtdt'), year(4, 5)] },
            in2027,
          ],
        },
        { kind: 'not', rule: programme('mtkom') },
      ],
    }
    expect(satisfies(rule, applicant()).ok).toBe(true)
    expect(satisfies(rule, applicant({ programme: 'mtkom' }))).toEqual({
      ok: false,
      reason: 'unmet',
      unmet: {
        kind: 'and',
        rules: [
          { kind: 'or', rules: [programme('mtdt'), in2027] },
          { kind: 'not', rule: programme('mtkom') },
        ],
      },
    })
  })
})

describe('without an applicant', () => {
  it('refuses before evaluating, so not cannot admit a missing attribute', () => {
    const rule: EligibilityRule = { kind: 'not', rule: programme('mtdt') }
    expect(satisfies(rule, null)).toEqual({ ok: false, reason: 'notEnrolled' })
  })
})

describe('applicantOf', () => {
  const mtdt: StudyProgramme = {
    uid: 'mtdt',
    name: 'MTDT',
    type: { kind: 'integratedMaster', duration: 5, years: [1, 2, 3, 4, 5] },
  }
  const now = Instant.parse('2026-09-27T10:00:00.000Z')

  it('derives the year from the expected graduation', () => {
    expect(
      applicantOf(
        { programme: mtdt, expectedGraduation: term('2029-spring') },
        now,
      ),
    ).toEqual({ programme: 'mtdt', year: 3, graduation: term('2029-spring') })
  })

  it('has no applicant outside the programme', () => {
    expect(
      applicantOf(
        { programme: mtdt, expectedGraduation: term('2026-spring') },
        now,
      ),
    ).toBeNull()
  })
})

describe('parseEligibility', () => {
  const stored = (rule: unknown) => ({ v: 1, rule })
  const errorsOf = (raw: unknown) => {
    const parsed = parseEligibility(raw)
    return parsed.ok ? [] : parsed.errors
  }

  it('round-trips a valid rule unchanged', () => {
    const rule: EligibilityRule = {
      kind: 'and',
      rules: [
        programme('mtdt'),
        { kind: 'not', rule: year(1) },
        { kind: 'graduation', from: term('2027-spring') },
      ],
    }
    const parsed = parseEligibility(JSON.parse(JSON.stringify(stored(rule))))
    expect(parsed).toEqual({ ok: true, value: { v: 1, rule } })
  })

  it('rejects an unknown version or a non-object', () => {
    expect(errorsOf({ v: 2, rule: programme('mtdt') })).toEqual([
      { code: 'unsupportedVersion', path: 'v' },
    ])
    expect(errorsOf('rule')).toEqual([{ code: 'malformed', path: '' }])
  })

  it('rejects each invalid leaf with its path', () => {
    expect(errorsOf(stored({ kind: 'nor' }))).toEqual([
      { code: 'unknownKind', path: 'rule' },
    ])
    expect(errorsOf(stored({ kind: 'programme', programmes: [] }))).toEqual([
      { code: 'emptyList', path: 'rule.programmes' },
    ])
    expect(errorsOf(stored({ kind: 'programme', programmes: [''] }))).toEqual([
      { code: 'malformed', path: 'rule.programmes' },
    ])
    expect(errorsOf(stored({ kind: 'year', years: [6] }))).toEqual([
      { code: 'invalidYear', path: 'rule.years' },
    ])
    expect(
      errorsOf(stored({ kind: 'graduation', from: '2027-summer' })),
    ).toEqual([{ code: 'invalidTerm', path: 'rule.from' }])
    expect(errorsOf(stored({ kind: 'graduation' }))).toEqual([
      { code: 'emptyRange', path: 'rule' },
    ])
    expect(
      errorsOf(
        stored({ kind: 'graduation', from: '2028-spring', to: '2027-autumn' }),
      ),
    ).toEqual([{ code: 'invertedRange', path: 'rule' }])
  })

  it('rejects an empty group, which would otherwise admit everyone', () => {
    expect(errorsOf(stored({ kind: 'and', rules: [] }))).toEqual([
      { code: 'emptyGroup', path: 'rule' },
    ])
  })

  it('collects every error in one pass', () => {
    const raw = stored({
      kind: 'or',
      rules: [
        { kind: 'year', years: [0] },
        { kind: 'not', rule: { kind: 'programme', programmes: [] } },
      ],
    })
    expect(errorsOf(raw)).toEqual([
      { code: 'invalidYear', path: 'rule.rules[0].years' },
      { code: 'emptyList', path: 'rule.rules[1].rule.programmes' },
    ])
  })

  it('caps nesting depth and size', () => {
    let deep: unknown = programme('mtdt')
    for (let level = 0; level < MAX_DEPTH; level++) {
      deep = { kind: 'not', rule: deep }
    }
    expect(errorsOf(stored(deep))).toEqual([
      { code: 'tooDeep', path: 'rule.rule.rule.rule.rule' },
    ])

    const wide = {
      kind: 'or',
      rules: Array(MAX_NODES).fill(programme('mtdt')),
    }
    expect(errorsOf(stored(wide))).toEqual([{ code: 'tooLarge', path: 'rule' }])
  })
})
