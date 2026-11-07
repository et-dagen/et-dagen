import { describe, expect, it } from 'vitest'
import { WallClock, checkedFairDates } from '@/domain/fair/dates'

describe('WallClock.tryParse', () => {
  it('adds the seconds a datetime field leaves out', () => {
    expect(WallClock.tryParse('2027-02-09T11:00')).toBe('2027-02-09T11:00:00')
    expect(WallClock.tryParse('2027-02-09T11:00:30')).toBe(
      '2027-02-09T11:00:30',
    )
  })

  it('refuses times that are not on the calendar or carry a zone', () => {
    expect(WallClock.tryParse('2027-02-30T11:00')).toBeNull()
    expect(WallClock.tryParse('2027-02-09T25:00')).toBeNull()
    expect(WallClock.tryParse('2027-02-09T11:00:00Z')).toBeNull()
    expect(WallClock.tryParse('2027-02-09')).toBeNull()
  })
})

describe('checkedFairDates', () => {
  it('takes a start and an end on or after it', () => {
    expect(
      checkedFairDates({ start: '2027-02-09T11:00', end: '2027-02-10T10:00' }),
    ).toEqual({ start: '2027-02-09T11:00:00', end: '2027-02-10T10:00:00' })
    expect(
      checkedFairDates({ start: '2027-02-09T11:00', end: '2027-02-09T11:00' }),
    ).toMatchObject({ start: '2027-02-09T11:00:00' })
  })

  it('refuses an end before the start, or a missing date', () => {
    const problem = { problem: 'fair/invalid-dates' }
    expect(
      checkedFairDates({ start: '2027-02-10T10:00', end: '2027-02-09T11:00' }),
    ).toEqual(problem)
    expect(checkedFairDates({ start: '2027-02-10T10:00' })).toEqual(problem)
    expect(checkedFairDates(undefined)).toEqual(problem)
  })
})
