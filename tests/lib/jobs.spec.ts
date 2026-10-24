import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time'
import {
  afterDeadline,
  deadlineState,
  fairEventsOf,
  formatDeadline,
  formatShortDeadline,
} from '@/lib/jobs'

// 12:00 in Oslo on 1 November 2026
const now = Instant.parse('2026-11-01T11:00:00.000Z')

describe('deadlineState', () => {
  it('counts the days left and marks a close deadline', () => {
    expect(deadlineState('2026-11-08', now)).toEqual({
      kind: 'open',
      days: 7,
      soon: true,
    })
    expect(deadlineState('2026-12-01', now)).toEqual({
      kind: 'open',
      days: 30,
      soon: false,
    })
  })

  it('keeps a date-only deadline open until the end of that day', () => {
    expect(deadlineState('2026-11-01', now)).toEqual({
      kind: 'open',
      days: 0,
      soon: true,
    })
    expect(deadlineState('2026-11-01T10:00', now)).toEqual({ kind: 'passed' })
    expect(deadlineState('2026-10-31', now)).toEqual({ kind: 'passed' })
  })

  it('reports a missing or malformed deadline', () => {
    expect(deadlineState(undefined, now)).toEqual({ kind: 'none' })
    expect(deadlineState('soon', now)).toEqual({ kind: 'none' })
  })
})

describe('formatDeadline', () => {
  it('shows the time only when it is not the end of the day', () => {
    expect(formatDeadline('2026-12-01', 'nb-NO')).toBe('1. desember 2026')
    expect(formatDeadline('2027-01-15T23:59', 'nb-NO')).toBe('15. januar 2027')
    expect(formatDeadline('2027-01-15T12:00', 'nb-NO')).toBe(
      '15. januar 2027 kl. 12:00',
    )
  })
})

describe('fairEventsOf', () => {
  const events = {
    later: {
      companyUID: 'c1',
      date: { start: '2026-11-06T14:00', end: '2026-11-06T16:00' },
    },
    other: {
      companyUID: 'c2',
      date: { start: '2026-11-04T17:15', end: '2026-11-04T19:00' },
    },
    soon: {
      companyUID: 'c1',
      date: { start: '2026-11-04T17:15', end: '2026-11-04T19:00' },
    },
    past: {
      companyUID: 'c1',
      date: { start: '2026-03-12T17:00', end: '2026-03-12T20:00' },
    },
  }

  it("lists the company's coming events, soonest first", () => {
    expect(fairEventsOf('c1', events, now).map((e) => e.uid)).toEqual([
      'soon',
      'later',
    ])
  })

  it('finds nothing without a company or events', () => {
    expect(fairEventsOf(undefined, events, now)).toEqual([])
    expect(fairEventsOf('c1', null, now)).toEqual([])
  })
})

describe('afterDeadline', () => {
  const event = { date: { start: '2026-11-12T17:15' } }

  it('marks an event that starts once applications have closed', () => {
    expect(afterDeadline(event, '2026-11-08')).toBe(true)
    expect(afterDeadline(event, '2026-11-12')).toBe(false)
  })

  it('marks nothing when a time is missing', () => {
    expect(afterDeadline(event, undefined)).toBe(false)
    expect(afterDeadline({}, '2026-11-08')).toBe(false)
  })
})

describe('formatShortDeadline', () => {
  const today = new Date('2026-11-01T11:00:00Z')

  it('leaves out this year and shows any other', () => {
    expect(formatShortDeadline('2026-11-03', 'nb-NO', today)).toBe('3. nov.')
    expect(formatShortDeadline('2027-01-15T23:59', 'nb-NO', today)).toBe(
      '15. jan. 2027',
    )
  })
})
