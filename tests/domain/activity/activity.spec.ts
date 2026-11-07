import { describe, expect, it } from 'vitest'
import { dayOf, keptSince } from '@/domain/activity/activity'
import { Instant } from '@/domain/time'

describe('dayOf', () => {
  it('counts days on Oslo’s calendar, in summer and in winter', () => {
    expect(dayOf(Instant.parse('2026-06-30T22:30:00.000Z'))).toBe('2026-07-01')
    expect(dayOf(Instant.parse('2026-06-30T21:30:00.000Z'))).toBe('2026-06-30')
    expect(dayOf(Instant.parse('2026-01-31T23:30:00.000Z'))).toBe('2026-02-01')
    expect(dayOf(Instant.parse('2026-01-31T22:30:00.000Z'))).toBe('2026-01-31')
  })
})

describe('keptSince', () => {
  it('is the retention limit before now', () => {
    expect(keptSince(Instant.parse('2026-10-31T12:00:00.000Z'))).toBe(
      '2026-10-01T12:00:00.000Z',
    )
  })
})
