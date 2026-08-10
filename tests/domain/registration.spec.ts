import { describe, expect, it } from 'vitest'
import {
  admits,
  hasSpots,
  isOpen,
  type Registration,
} from '~/domain/event/registration'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'

const opens = Instant.parse('2026-08-01T10:00:00.000Z')
const during = Instant.parse('2026-08-05T10:00:00.000Z')
const after = Instant.parse('2026-08-20T10:00:00.000Z')

const open: Registration = {
  period: { start: opens, duration: Duration.fromDays(14) },
  attendanceLimit: null,
}

describe('isOpen', () => {
  it('opens exactly at the start instant and shuts at the end', () => {
    expect(isOpen(open, Instant.parse('2026-07-31T10:00:00.000Z'))).toBe(false)
    expect(isOpen(open, opens)).toBe(true)
    expect(isOpen(open, during)).toBe(true)
    expect(isOpen(open, after)).toBe(false)
  })

  it('accepts a Date converted at the boundary, as the authorization layer will', () => {
    expect(isOpen(open, Instant.of(new Date('2026-08-05T10:00:00.000Z')))).toBe(
      true,
    )
  })
})

describe('hasSpots', () => {
  const limited: Registration = { ...open, attendanceLimit: 2 }

  it('admits up to the limit and refuses at it', () => {
    expect(hasSpots(limited, 1)).toBe(true)
    expect(hasSpots(limited, 2)).toBe(false)
    expect(hasSpots(limited, 3)).toBe(false)
  })

  it('treats a null limit as unlimited spots', () => {
    expect(hasSpots(open, 10_000)).toBe(true)
  })
})

describe('admits', () => {
  it('lets anyone in when the event carries no rule', () => {
    expect(admits(open, { programme: 'mtiot', year: 1 })).toBe(true)
    expect(admits(open, {})).toBe(true)
  })

  it('applies the rule when there is one', () => {
    const restricted: Registration = {
      ...open,
      eligibility: {
        kind: 'every',
        rules: [
          { kind: 'programme', programmes: ['mtdt'] },
          { kind: 'year', years: [4, 5] },
        ],
      },
    }
    expect(admits(restricted, { programme: 'mtdt', year: 5 })).toBe(true)
    expect(admits(restricted, { programme: 'mtdt', year: 2 })).toBe(false)
    expect(admits(restricted, { programme: 'mtiot', year: 5 })).toBe(false)
  })
})
