import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time'
import {
  daysUntil,
  deadlineOf,
  formatDay,
  formatInstant,
  instantOf,
  osloDay,
} from '@/lib/time'

// 23:30 in Oslo on 1 November 2026, so the date in UTC is a day behind Oslo's at midnight
const now = Instant.parse('2026-11-01T22:30:00.000Z')

describe('instantOf', () => {
  it('reads Oslo wall-clock time and rejects anything else', () => {
    expect(instantOf('2026-11-04T17:15')).toBe('2026-11-04T16:15:00.000Z')
    expect(instantOf('4/11')).toBeNull()
    expect(instantOf(undefined)).toBeNull()
  })
})

describe('daysUntil', () => {
  it('counts calendar days in Oslo', () => {
    expect(daysUntil('2026-11-01T23:59', now)).toBe(0)
    expect(daysUntil('2026-11-02T00:01', now)).toBe(1)
    expect(daysUntil('2026-10-30T12:00', now)).toBe(-2)
  })
})

describe('deadlineOf', () => {
  it('reads a date as the end of that day and keeps date-times', () => {
    expect(deadlineOf('2026-12-10')).toBe('2026-12-10T23:59')
    expect(deadlineOf('2026-12-10T12:00')).toBe('2026-12-10T12:00')
    expect(daysUntil(deadlineOf('2026-11-01'), now)).toBe(0)
  })
})

describe('osloDay', () => {
  it("gives Oslo's date, which runs ahead of UTC's around midnight", () => {
    expect(osloDay(now)).toBe('2026-11-01')
    expect(osloDay(Instant.parse('2026-11-01T23:30:00.000Z'))).toBe(
      '2026-11-02',
    )
  })
})

describe('formatInstant', () => {
  it('shows an instant in Oslo time, wherever the code runs', () => {
    const at = Instant.parse('2026-11-04T16:15:00.000Z')
    expect(
      formatInstant(at, 'en-GB', { hour: '2-digit', minute: '2-digit' }),
    ).toBe('17:15')
  })
})

describe('formatDay', () => {
  it('shows a calendar day without shifting it to another date', () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' } as const
    expect(formatDay('2026-11-04', 'en-GB', options)).toBe(
      'Wednesday 4 November',
    )
    expect(formatDay('2026-11-04', 'nb-NO', options)).toBe('onsdag 4. november')
  })
})
