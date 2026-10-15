import { describe, expect, it } from 'vitest'
import {
  admits,
  hasSpots,
  isOpen,
  type Registration,
} from '~/domain/event/registration'
import { Term } from '@/domain/ntnu'
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
  const student = {
    programme: 'mtdt',
    year: 5,
    graduation: Term.parse('2027-spring'),
  } as const

  it('lets anyone in when the event carries no rule', () => {
    expect(admits(open, student)).toEqual({ ok: true })
    expect(admits(open, null)).toEqual({ ok: true })
  })

  it('applies the rule when there is one, and says what was unmet', () => {
    const restricted: Registration = {
      ...open,
      eligibility: {
        kind: 'and',
        rules: [
          { kind: 'programme', programmes: ['mtdt'] },
          { kind: 'year', years: [4, 5] },
        ],
      },
    }
    expect(admits(restricted, student)).toEqual({ ok: true })
    expect(admits(restricted, { ...student, year: 2 })).toEqual({
      ok: false,
      reason: 'unmet',
      unmet: { kind: 'year', years: [4, 5] },
    })
    expect(admits(restricted, null)).toEqual({
      ok: false,
      reason: 'notEnrolled',
    })
  })
})
