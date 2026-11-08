import { describe, expect, it } from 'vitest'
import { Instant, type ISO8601Literal } from '@/domain/time'
import { fairDateLine, timeUntil } from '@/lib/site/fair'

const at = (iso: ISO8601Literal) => Instant.parse(iso)
const fair = {
  date: { start: '2027-02-09T11:00:00', end: '2027-02-10T10:00:00' },
}

describe('fairDateLine', () => {
  it('names the month once when the fair stays in it', () => {
    expect(fairDateLine(fair, 'nb-NO')).toBe('9. - 10. februar')
    expect(fairDateLine(fair, 'en-GB')).toBe('9. - 10. February')
  })

  it('names both months when the fair crosses one', () => {
    const across = {
      date: { start: '2027-02-28T11:00', end: '2027-03-01T16:00' },
    }
    expect(fairDateLine(across, 'nb-NO')).toBe('28. februar - 1. mars')
  })

  it('reads the days in Oslo', () => {
    const late = {
      date: { start: '2027-02-09T23:30', end: '2027-02-10T23:30' },
    }
    expect(fairDateLine(late, 'nb-NO')).toBe('9. - 10. februar')
  })

  it('has nothing to say without dates', () => {
    expect(fairDateLine(null, 'nb-NO')).toBeNull()
    expect(fairDateLine({}, 'nb-NO')).toBeNull()
  })
})

describe('timeUntil', () => {
  const start = at('2027-02-09T10:00:00.000Z')

  it('splits the time left into days, hours, minutes and seconds', () => {
    expect(timeUntil(start, at('2027-02-07T08:58:30.500Z'))).toEqual({
      days: 2,
      hours: 1,
      minutes: 1,
      seconds: 29,
    })
  })

  it('is zero once the time has passed', () => {
    const zero = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    expect(timeUntil(start, start)).toEqual(zero)
    expect(timeUntil(start, at('2027-02-10T10:00:00.000Z'))).toEqual(zero)
  })
})
