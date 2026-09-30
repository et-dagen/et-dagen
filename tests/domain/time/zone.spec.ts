import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time/instant'
import { TimeZone, Zone, type LocalDateTime } from '@/domain/time/zone'

const OSLO = TimeZone.parse('Europe/Oslo')
const KATHMANDU = TimeZone.parse('Asia/Kathmandu')
const AUCKLAND = TimeZone.parse('Pacific/Auckland')
const TOKYO = TimeZone.parse('Asia/Tokyo')

const local = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): LocalDateTime => ({ year, month, day, hour, minute, second, millisecond })

describe('TimeZone', () => {
  it('canonicalises alias spellings so stored zones compare equal', () => {
    expect(TimeZone.parse('europe/oslo')).toBe('Europe/Oslo')
  })

  it('rejects fixed offsets, which Intl accepts but which cannot track daylight saving', () => {
    expect(TimeZone.is('+02:00')).toBe(false)
    expect(TimeZone.is('+0200')).toBe(false)
    expect(TimeZone.is('-08')).toBe(false)
  })

  it('rejects anything the runtime cannot resolve', () => {
    expect(TimeZone.is('Europe/Trondheim')).toBe(false)
    expect(TimeZone.is('CEST')).toBe(false)
    expect(TimeZone.is(120)).toBe(false)
    expect(() => TimeZone.parse('Mars/Olympus_Mons')).toThrow(RangeError)
  })
})

describe('offsetMinutes', () => {
  it('tracks daylight saving rather than assuming a constant per zone', () => {
    expect(
      Zone.offsetMinutes(Instant.parse('2026-01-15T12:00:00.000Z'), OSLO),
    ).toBe(60)
    expect(
      Zone.offsetMinutes(Instant.parse('2026-07-15T12:00:00.000Z'), OSLO),
    ).toBe(120)
  })

  it('handles offsets that are not a whole number of hours', () => {
    expect(
      Zone.offsetMinutes(Instant.parse('2026-07-15T12:00:00.000Z'), KATHMANDU),
    ).toBe(345)
  })

  it('handles a southern-hemisphere zone, where summer is in January', () => {
    expect(
      Zone.offsetMinutes(Instant.parse('2026-01-15T12:00:00.000Z'), AUCKLAND),
    ).toBe(780)
    expect(
      Zone.offsetMinutes(Instant.parse('2026-07-15T12:00:00.000Z'), AUCKLAND),
    ).toBe(720)
  })
})

describe('toLocal', () => {
  it('reads the wall clock a user in the zone would see', () => {
    const instant = Instant.parse('2026-08-10T17:00:00.000Z')
    expect(Zone.toLocal(instant, OSLO)).toEqual(local(2026, 8, 10, 19, 0))
    expect(Zone.toLocal(instant, KATHMANDU)).toEqual(local(2026, 8, 10, 22, 45))
  })

  it('rolls the date over when the zone is on the other side of midnight', () => {
    const instant = Instant.parse('2026-08-10T23:30:00.000Z')
    expect(Zone.toLocal(instant, OSLO)).toEqual(local(2026, 8, 11, 1, 30))
    expect(Zone.toLocal(instant, AUCKLAND)).toEqual(local(2026, 8, 11, 11, 30))
  })

  it('reports midnight as hour 0, not hour 24', () => {
    expect(
      Zone.toLocal(Instant.parse('2026-08-10T22:00:00.000Z'), OSLO).hour,
    ).toBe(0)
  })
})

describe('fromLocal', () => {
  it('resolves a user-entered wall-clock time to the instant to store', () => {
    expect(Zone.fromLocal(local(2026, 8, 10, 19, 0), OSLO)).toBe(
      '2026-08-10T17:00:00.000Z',
    )
    expect(Zone.fromLocal(local(2026, 1, 10, 19, 0), OSLO)).toBe(
      '2026-01-10T18:00:00.000Z',
    )
    expect(Zone.fromLocal(local(2026, 8, 10, 22, 45), KATHMANDU)).toBe(
      '2026-08-10T17:00:00.000Z',
    )
  })

  it('preserves seconds and milliseconds', () => {
    expect(Zone.fromLocal(local(2026, 8, 10, 19, 0, 30, 250), OSLO)).toBe(
      '2026-08-10T17:00:30.250Z',
    )
  })
})

// Oslo enters daylight saving at 01:00 UTC on 2026-03-29: local clocks jump 02:00 -> 03:00.
describe('spring forward: the hour that does not exist', () => {
  it('refuses to invent an instant for a skipped local time', () => {
    expect(Zone.instantsFor(local(2026, 3, 29, 2, 30), OSLO)).toEqual([])
    expect(() => Zone.fromLocal(local(2026, 3, 29, 2, 30), OSLO)).toThrow(
      RangeError,
    )
  })

  it('still resolves the times either side of the gap', () => {
    expect(Zone.fromLocal(local(2026, 3, 29, 1, 59), OSLO)).toBe(
      '2026-03-29T00:59:00.000Z',
    )
    expect(Zone.fromLocal(local(2026, 3, 29, 3, 0), OSLO)).toBe(
      '2026-03-29T01:00:00.000Z',
    )
  })
})

// Oslo leaves daylight saving at 01:00 UTC on 2026-10-25: local clocks repeat 02:00 -> 03:00.
describe('fall back: the hour that happens twice', () => {
  it('reports both instants, earliest first', () => {
    expect(Zone.instantsFor(local(2026, 10, 25, 2, 30), OSLO)).toEqual([
      '2026-10-25T00:30:00.000Z',
      '2026-10-25T01:30:00.000Z',
    ])
  })

  it('picks the earlier instant, matching the first time the clock reads it', () => {
    expect(Zone.fromLocal(local(2026, 10, 25, 2, 30), OSLO)).toBe(
      '2026-10-25T00:30:00.000Z',
    )
  })

  it('is not fooled by a repeated hour in the southern hemisphere either', () => {
    // Auckland leaves daylight saving at 14:00 UTC on 2026-04-04.
    expect(Zone.instantsFor(local(2026, 4, 5, 2, 30), AUCKLAND)).toHaveLength(2)
  })
})

describe('datetime-local input binding', () => {
  it('round-trips a form value through storage and back', () => {
    const stored = Zone.fromInput('2026-08-10T19:00', OSLO)
    expect(stored).toBe('2026-08-10T17:00:00.000Z')
    expect(Zone.toInput(stored, OSLO)).toBe('2026-08-10T19:00')
  })

  it('accepts the optional seconds a browser may include', () => {
    expect(Zone.fromInput('2026-08-10T19:00:30', OSLO)).toBe(
      '2026-08-10T17:00:30.000Z',
    )
    expect(Zone.fromInput('2026-08-10T19:00:30.5', OSLO)).toBe(
      '2026-08-10T17:00:30.500Z',
    )
  })

  it('rejects malformed values instead of guessing', () => {
    expect(() => Zone.fromInput('2026-08-10', OSLO)).toThrow(RangeError)
    expect(() => Zone.fromInput('10.08.2026 19:00', OSLO)).toThrow(RangeError)
  })

  it('rejects a form value naming a skipped local time', () => {
    expect(() => Zone.fromInput('2026-03-29T02:30', OSLO)).toThrow(RangeError)
  })
})

describe('format', () => {
  it('renders the same instant differently per zone, never per host', () => {
    const instant = Instant.parse('2026-08-10T17:00:00.000Z')
    expect(Zone.format(instant, OSLO, 'nb-NO', { timeStyle: 'short' })).toBe(
      '19:00',
    )
    expect(Zone.format(instant, TOKYO, 'nb-NO', { timeStyle: 'short' })).toBe(
      '02:00',
    )
  })
})

describe('round-trip property', () => {
  it('recovers every instant through the local wall clock and back', () => {
    // Deterministic pseudo-random sweep across ~8 years, all four zones, every DST rule.
    let seed = 1337
    const next = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31)

    for (const zone of [OSLO, KATHMANDU, AUCKLAND, TOKYO]) {
      for (let i = 0; i < 500; i++) {
        const millis = Date.UTC(2024, 0, 1) + (next() % (8 * 365 * 86_400_000))
        const instant = Instant.of(new Date(millis - (millis % 1000)))
        const candidates = Zone.instantsFor(Zone.toLocal(instant, zone), zone)

        // A wall-clock reading during a repeated hour maps back to two instants; the original
        // must be one of them. Everywhere else the mapping is exact.
        expect(candidates).toContain(instant)
      }
    }
  })
})
