import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time'
import { daysUntil, instantOf } from '@/lib/admin/time'

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
