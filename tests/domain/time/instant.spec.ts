import { describe, expect, it } from 'vitest'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'

describe('validation beyond what the template literal can express', () => {
  it('accepts a real UTC timestamp', () => {
    expect(Instant.is('2026-08-10T17:00:00.000Z')).toBe(true)
    expect(Instant.is('2028-02-29T17:00:00.000Z')).toBe(true)
  })

  it('rejects values the literal type admits but the calendar does not', () => {
    expect(Instant.is('2026-13-10T17:00:00.000Z')).toBe(false)
    expect(Instant.is('2026-02-30T17:00:00.000Z')).toBe(false)
    expect(Instant.is('2027-02-29T17:00:00.000Z')).toBe(false)
  })

  it('rejects fields wider than their fixed width', () => {
    expect(Instant.is('20261-08-10T17:00:00.000Z')).toBe(false)
    expect(Instant.is('2026-08-10T17:00:00.00000Z')).toBe(false)
  })

  it('requires UTC, so two instants are always directly comparable', () => {
    expect(Instant.is('2026-08-10T17:00:00.000+02:00')).toBe(false)
    expect(Instant.is('2026-08-10T17:00:00Z')).toBe(false)
  })

  it('throws on parse and returns null on tryParse', () => {
    expect(() => Instant.parse('2026-13-10T17:00:00.000Z')).toThrow(RangeError)
    expect(Instant.tryParse('nonsense')).toBeNull()
  })

  it('refuses to convert an invalid Date', () => {
    expect(() => Instant.of(new Date('nope'))).toThrow(RangeError)
  })
})

describe('arithmetic with durations', () => {
  const start = Instant.parse('2026-08-10T17:00:00.000Z')

  it('shifts forward and back', () => {
    expect(Instant.add(start, Duration.fromMinutes(90))).toBe(
      '2026-08-10T18:30:00.000Z',
    )
    expect(Instant.sub(start, Duration.fromHours(1))).toBe(
      '2026-08-10T16:00:00.000Z',
    )
  })

  it('measures the span between two instants', () => {
    expect(
      Instant.durationSince(Instant.parse('2026-08-10T18:30:00.000Z'), start),
    ).toBe('PT1H30M')
  })

  it('round-trips start + duration back to the same duration', () => {
    const span = Duration.fromMinutes(90)
    expect(Instant.durationSince(Instant.add(start, span), start)).toBe(span)
  })

  it('offers Rust’s three behaviours when the arguments are reversed', () => {
    const later = Instant.parse('2026-08-10T18:30:00.000Z')
    expect(() => Instant.durationSince(start, later)).toThrow(RangeError)
    expect(Instant.checkedDurationSince(start, later)).toBeNull()
    expect(Instant.saturatingDurationSince(start, later)).toBe('PT0S')
  })

  it('adds exact time, so a daylight-saving change never shifts the result', () => {
    // Oslo clocks go back during this hour; the UTC instant advances by exactly three hours.
    expect(
      Instant.add(
        Instant.parse('2026-10-25T00:00:00.000Z'),
        Duration.fromHours(3),
      ),
    ).toBe('2026-10-25T03:00:00.000Z')
  })

  it('orders instants', () => {
    expect(
      Math.sign(
        Instant.compare(start, Instant.parse('2026-08-10T18:30:00.000Z')),
      ),
    ).toBe(-1)
    expect(Instant.compare(start, start)).toBe(0)
  })
})
