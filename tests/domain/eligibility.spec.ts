import { describe, expect, it } from 'vitest'
import {
  applicantOf,
  satisfies,
  type EligibilityRule,
} from '~/domain/authorization/eligibility'
import type { StudyProgramme } from '@/domain/ntnu'

const programme = (uid: string): StudyProgramme => ({
  uid,
  name: uid,
  type: { kind: 'integratedMaster', duration: 5, years: [1, 2, 3, 4, 5] },
})

describe('programme rule', () => {
  const rule: EligibilityRule = {
    kind: 'programme',
    programmes: ['mtdt', 'mtkom'],
  }

  it('admits any listed programme and rejects the rest', () => {
    expect(satisfies(rule, { programme: 'mtdt' })).toBe(true)
    expect(satisfies(rule, { programme: 'mtkom' })).toBe(true)
    expect(satisfies(rule, { programme: 'mtiot' })).toBe(false)
  })

  it('fails closed when the attribute is missing', () => {
    expect(satisfies(rule, {})).toBe(false)
  })
})

describe('year rule', () => {
  const rule: EligibilityRule = { kind: 'year', years: [4, 5] }

  it('ignores the programme entirely', () => {
    expect(satisfies(rule, { programme: 'mtdt', year: 4 })).toBe(true)
    expect(satisfies(rule, { programme: 'mtiot', year: 5 })).toBe(true)
    expect(satisfies(rule, { programme: 'mtdt', year: 3 })).toBe(false)
  })

  it('reads the legacy RTDB string years the authorization Subject passes through', () => {
    expect(satisfies(rule, { year: '4' })).toBe(true)
    expect(satisfies(rule, { year: '3' })).toBe(false)
  })

  it('fails closed on a missing or unparseable year rather than admitting', () => {
    expect(satisfies(rule, {})).toBe(false)
    expect(satisfies(rule, { year: '' })).toBe(false)
    expect(satisfies(rule, { year: 'fourth' })).toBe(false)
    expect(satisfies(rule, { year: 4.5 })).toBe(false)
  })
})

describe('combinations', () => {
  it('requires both sides under every', () => {
    const rule: EligibilityRule = {
      kind: 'every',
      rules: [
        { kind: 'programme', programmes: ['mtdt'] },
        { kind: 'year', years: [4, 5] },
      ],
    }
    expect(satisfies(rule, { programme: 'mtdt', year: 4 })).toBe(true)
    expect(satisfies(rule, { programme: 'mtdt', year: 2 })).toBe(false)
    expect(satisfies(rule, { programme: 'mtiot', year: 4 })).toBe(false)
  })

  it('accepts either side under some', () => {
    const rule: EligibilityRule = {
      kind: 'some',
      rules: [
        { kind: 'programme', programmes: ['mtdt'] },
        { kind: 'year', years: [5] },
      ],
    }
    expect(satisfies(rule, { programme: 'mtdt', year: 1 })).toBe(true)
    expect(satisfies(rule, { programme: 'mtiot', year: 5 })).toBe(true)
    expect(satisfies(rule, { programme: 'mtiot', year: 1 })).toBe(false)
  })

  it('nests to arbitrary depth', () => {
    // Fifth-year students on either programme, or anyone at all in their first year.
    const rule: EligibilityRule = {
      kind: 'some',
      rules: [
        {
          kind: 'every',
          rules: [
            { kind: 'programme', programmes: ['mtdt', 'mtkom'] },
            { kind: 'year', years: [5] },
          ],
        },
        { kind: 'year', years: [1] },
      ],
    }
    expect(satisfies(rule, { programme: 'mtdt', year: 5 })).toBe(true)
    expect(satisfies(rule, { programme: 'mtiot', year: 1 })).toBe(true)
    expect(satisfies(rule, { programme: 'mtdt', year: 3 })).toBe(false)
    expect(satisfies(rule, { programme: 'mtiot', year: 5 })).toBe(false)
  })

  it('reads empty collections the conventional way', () => {
    expect(satisfies({ kind: 'every', rules: [] }, {})).toBe(true)
    expect(satisfies({ kind: 'some', rules: [] }, {})).toBe(false)
  })
})

describe('applicantOf', () => {
  it('flattens a student to the attribute shape the authorization Subject uses', () => {
    expect(applicantOf({ programme: programme('mtdt'), year: 3 })).toEqual({
      programme: 'mtdt',
      year: 3,
    })
  })
})
