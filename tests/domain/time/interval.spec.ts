import { describe, expect, it } from 'vitest'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'
import { contains, endOf, withinTimeWindow } from '@/domain/time/interval'

const start = Instant.parse('2026-08-10T17:00:00.000Z')
const interval = { start, duration: Duration.fromMinutes(90) }

describe('endOf', () => {
  it('derives the end so it cannot drift from the start', () => {
    expect(endOf(interval)).toBe('2026-08-10T18:30:00.000Z')
  })
})

describe('contains', () => {
  it('is half-open, so back-to-back intervals never both claim the boundary', () => {
    expect(contains(interval, start)).toBe(true)
    expect(contains(interval, endOf(interval))).toBe(false)
  })

  it('covers the interior and excludes either side', () => {
    expect(contains(interval, Instant.parse('2026-08-10T18:00:00.000Z'))).toBe(
      true,
    )
    expect(contains(interval, Instant.parse('2026-08-10T16:59:59.999Z'))).toBe(
      false,
    )
    expect(contains(interval, Instant.parse('2026-08-10T18:30:00.001Z'))).toBe(
      false,
    )
  })
})

describe('withinTimeWindow', () => {
  const end = endOf(interval)

  it('compares on the UTC timeline rather than a host wall clock', () => {
    expect(
      withinTimeWindow(start, end, new Date('2026-08-10T17:00:00.000Z')),
    ).toBe(true)
    expect(
      withinTimeWindow(start, end, new Date('2026-08-10T18:29:59.999Z')),
    ).toBe(true)
    expect(
      withinTimeWindow(start, end, new Date('2026-08-10T18:30:00.000Z')),
    ).toBe(false)
    expect(
      withinTimeWindow(start, end, new Date('2026-08-10T16:59:59.999Z')),
    ).toBe(false)
  })
})
