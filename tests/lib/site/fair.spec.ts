import { describe, expect, it } from 'vitest'
import { Instant, type ISO8601Literal } from '@/domain/time'
import { fairDays, placesLeft, upcoming } from '@/lib/site/fair'

const at = (iso: ISO8601Literal) => Instant.parse(iso)
const autumn = at('2026-10-27T08:00:00.000Z')
const fair = {
  date: { start: '2027-02-09T11:00:00', end: '2027-02-10T10:00:00' },
}

describe('fairDays', () => {
  it('writes Norwegian days with a point', () => {
    expect(fairDays(fair, 'nb-NO', autumn)).toEqual({
      days: '9.–10.',
      month: 'februar 2027',
    })
  })

  it("takes the site's own code for Norwegian", () => {
    expect(fairDays(fair, 'no', autumn)?.days).toBe('9.–10.')
  })

  it('writes English days without one', () => {
    expect(fairDays(fair, 'en-GB', autumn)).toEqual({
      days: '9–10',
      month: 'February 2027',
    })
  })

  it('writes one day once', () => {
    const one = { date: { start: '2027-02-09T11:00', end: '2027-02-09T16:00' } }
    expect(fairDays(one, 'nb-NO', autumn)?.days).toBe('9.')
  })

  it('names the first month when the fair crosses one', () => {
    const across = {
      date: { start: '2027-02-28T11:00', end: '2027-03-01T16:00' },
    }
    expect(fairDays(across, 'nb-NO', autumn)).toEqual({
      days: '28. februar–1.',
      month: 'mars 2027',
    })
  })

  it('has nothing to say without dates or after the fair', () => {
    expect(fairDays(null, 'nb-NO', autumn)).toBeNull()
    expect(fairDays({}, 'nb-NO', autumn)).toBeNull()
    expect(fairDays(fair, 'nb-NO', at('2027-02-11T08:00:00.000Z'))).toBeNull()
  })
})

const events = {
  late: {
    title: 'Bankett',
    date: { start: '2027-02-10T19:00', end: '2027-02-10T23:00' },
  },
  early: {
    title: 'Speedbedpress',
    date: { start: '2027-02-09T12:00', end: '2027-02-09T13:00' },
  },
  over: {
    title: 'Kick-off',
    date: { start: '2026-09-01T12:00', end: '2026-09-01T14:00' },
  },
  undated: { title: 'Mangler tid' },
}

describe('upcoming', () => {
  it('lists events that have not finished, soonest first', () => {
    expect(upcoming(events, autumn, 5).map((e) => e.uid)).toEqual([
      'early',
      'late',
    ])
  })

  it('stops at the limit', () => {
    expect(upcoming(events, autumn, 1).map((e) => e.uid)).toEqual(['early'])
  })
})

describe('placesLeft', () => {
  const talk = {
    date: { start: '2027-02-09T17:15', end: '2027-02-09T19:00' },
    registration: { start: '2026-10-01T10:00', end: '2027-02-08T23:59' },
    capacity: 3,
    attendants: { ada: {}, bo: {} },
  }

  it('counts the free places while sign-up is open', () => {
    expect(placesLeft(talk, autumn)).toBe(1)
  })

  it('has no count when the event is full or takes no sign-ups', () => {
    expect(placesLeft({ ...talk, capacity: 2 }, autumn)).toBeNull()
    expect(placesLeft({ ...talk, capacity: null }, autumn)).toBeNull()
  })
})
