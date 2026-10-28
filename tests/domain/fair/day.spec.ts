import { describe, expect, it } from 'vitest'
import { FairDay } from '@/domain/fair/day'

describe('FairDay', () => {
  it('takes a real calendar date as YYYY-MM-DD', () => {
    expect(FairDay.tryParse('2026-11-04')).toBe('2026-11-04')
    expect(FairDay.tryParse('2028-02-29')).toBe('2028-02-29')
  })

  it('refuses other shapes and days that do not exist', () => {
    for (const value of [
      '2026-11-4',
      '04.11.2026',
      '2026-02-30',
      '2026-13-01',
      '',
      '../x',
    ]) {
      expect(FairDay.tryParse(value)).toBeNull()
    }
    expect(() => FairDay.parse('2026-02-30')).toThrow(RangeError)
  })
})
