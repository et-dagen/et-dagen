import { describe, expect, it } from 'vitest'
import { Duration, type DurationParts } from '@/domain/time/duration'

describe('construction', () => {
  it('normalises any unit to the shortest equivalent literal', () => {
    expect(Duration.fromMinutes(90)).toBe('PT1H30M')
    expect(Duration.fromSeconds(3661)).toBe('PT1H1M1S')
    expect(Duration.fromMillis(1500)).toBe('PT1.5S')
    expect(Duration.fromDays(2)).toBe('P2D')
    expect(Duration.fromHours(25)).toBe('P1DT1H')
    expect(Duration.ZERO).toBe('PT0S')
  })

  it('refuses negative and sub-millisecond lengths, as an unsigned duration must', () => {
    expect(() => Duration.fromSeconds(-1)).toThrow(RangeError)
    expect(() => Duration.fromMillis(0.5)).toThrow(RangeError)
  })
})

describe('validation', () => {
  it('accepts the fixed-length subset', () => {
    expect(Duration.is('PT1H30M')).toBe(true)
    expect(Duration.is('P1DT2H3M4.5S')).toBe(true)
  })

  it('rejects literals with no components', () => {
    expect(Duration.is('P')).toBe(false)
    expect(Duration.is('PT')).toBe(false)
  })

  it('rejects calendar units, which have no fixed length', () => {
    expect(Duration.is('P1M')).toBe(false)
    expect(Duration.is('P1Y')).toBe(false)
    expect(Duration.is('P1W')).toBe(false)
  })

  it('rejects malformed and signed input', () => {
    expect(Duration.is('1H')).toBe(false)
    expect(Duration.is('PT-1H')).toBe(false)
    expect(Duration.tryParse('nope')).toBeNull()
  })
})

describe('accessors', () => {
  it('reports exact milliseconds and floors larger units', () => {
    expect(Duration.asMillis(Duration.parse('PT1.25S'))).toBe(1250)
    expect(Duration.asSeconds(Duration.fromMillis(1999))).toBe(1)
    expect(Duration.asMinutes(Duration.parse('PT1H30M'))).toBe(90)
    expect(Duration.asHours(Duration.parse('PT1H30M'))).toBe(1)
  })
})

describe('arithmetic', () => {
  it('adds, subtracts, multiplies and orders', () => {
    expect(
      Duration.add(Duration.fromMinutes(45), Duration.fromMinutes(45)),
    ).toBe('PT1H30M')
    expect(Duration.sub(Duration.fromHours(2), Duration.fromMinutes(30))).toBe(
      'PT1H30M',
    )
    expect(Duration.mul(Duration.fromMinutes(20), 3)).toBe('PT1H')
    expect(
      Math.sign(
        Duration.compare(Duration.fromSeconds(1), Duration.fromSeconds(2)),
      ),
    ).toBe(-1)
    expect(Duration.isZero(Duration.ZERO)).toBe(true)
  })

  it('offers Rust’s three underflow behaviours', () => {
    const [one, two] = [Duration.fromSeconds(1), Duration.fromSeconds(2)]
    expect(() => Duration.sub(one, two)).toThrow(RangeError)
    expect(Duration.checkedSub(one, two)).toBeNull()
    expect(Duration.saturatingSub(one, two)).toBe('PT0S')
  })
})

describe('platform duration record', () => {
  it('splits into the shape Intl.DurationFormat and Temporal.Duration accept', () => {
    expect(Duration.toParts(Duration.parse('P1DT2H3M4.5S'))).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
      milliseconds: 500,
    })
  })

  it('round-trips through the record', () => {
    const duration = Duration.parse('P1DT2H3M4.5S')
    expect(Duration.fromParts(Duration.toParts(duration))).toBe(duration)
  })

  it('feeds Intl.DurationFormat unchanged where the runtime provides it', () => {
    // Reached through a local type rather than a global augmentation: TypeScript 5.7 has no
    // lib definition for Intl.DurationFormat, and declaring one would collide once it ships.
    const { DurationFormat } = Intl as typeof Intl & {
      DurationFormat?: new (
        locale: string,
        options?: { style?: 'long' | 'short' | 'narrow' },
      ) => { format(parts: DurationParts): string }
    }
    if (!DurationFormat) return

    const formatted = new DurationFormat('en', { style: 'narrow' }).format(
      Duration.toParts(Duration.fromMinutes(90)),
    )
    expect(formatted).toContain('1')
  })
})
