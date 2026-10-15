import { describe, expect, it } from 'vitest'
import { Term, yearAt, type ProgrammeType } from '~/domain/ntnu'
import { Instant, type ISO8601Literal } from '@/domain/time/instant'

const integratedMaster: ProgrammeType = {
  kind: 'integratedMaster',
  duration: 5,
  years: [1, 2, 3, 4, 5],
}
const at = (value: ISO8601Literal) => Instant.parse(value)

describe('Term', () => {
  it('accepts only a four-digit year and a season', () => {
    expect(Term.is('2027-spring')).toBe(true)
    expect(Term.is('2027-autumn')).toBe(true)
    expect(Term.is('2027-summer')).toBe(false)
    expect(Term.is('27-spring')).toBe(false)
    expect(Term.tryParse('spring')).toBeNull()
    expect(() => Term.parse('2027')).toThrow(RangeError)
  })

  it('places January to June in spring and July to December in autumn', () => {
    expect(Term.at(at('2026-06-30T10:00:00.000Z'))).toBe('2026-spring')
    expect(Term.at(at('2026-07-01T10:00:00.000Z'))).toBe('2026-autumn')
  })

  it('orders terms', () => {
    const spring = Term.parse('2027-spring')
    const autumn = Term.parse('2027-autumn')
    expect(Term.compare(spring, autumn)).toBeLessThan(0)
    expect(Term.compare(autumn, Term.parse('2028-spring'))).toBeLessThan(0)
    expect(Term.compare(spring, spring)).toBe(0)
  })
})

describe('yearAt', () => {
  const graduation = Term.parse('2029-spring')

  it('counts down to the final year', () => {
    expect(
      yearAt(integratedMaster, graduation, at('2024-09-01T10:00:00.000Z')),
    ).toBe(1)
    expect(
      yearAt(integratedMaster, graduation, at('2026-09-01T10:00:00.000Z')),
    ).toBe(3)
    expect(
      yearAt(integratedMaster, graduation, at('2029-03-01T10:00:00.000Z')),
    ).toBe(5)
  })

  it('rounds half a year behind down to the lower year', () => {
    expect(
      yearAt(
        integratedMaster,
        Term.parse('2029-autumn'),
        at('2026-09-01T10:00:00.000Z'),
      ),
    ).toBe(2)
  })

  it('has no year before the programme starts or after it ends', () => {
    expect(
      yearAt(integratedMaster, graduation, at('2024-03-01T10:00:00.000Z')),
    ).toBeNull()
    expect(
      yearAt(integratedMaster, graduation, at('2029-09-01T10:00:00.000Z')),
    ).toBeNull()
  })
})
