import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time'
import {
  initialDay,
  isOver,
  nowAndNext,
  programmeDays,
  standMapsByDay,
  upcomingDays,
} from '@/lib/programme'

const events = {
  late: {
    title: 'Mingling',
    date: { start: '2026-11-04T19:00', end: '2026-11-04T22:00' },
  },
  talk: {
    title: 'Presentasjon',
    date: { start: '2026-11-04T17:15', end: '2026-11-04T19:00' },
  },
  kick: {
    title: 'Kick-off',
    date: { start: '2026-11-03T12:00', end: '2026-11-03T14:00' },
  },
  undated: { title: 'Mangler tid' },
}
const days = programmeDays(events)

describe('programmeDays', () => {
  it('groups events by Oslo day in order, by start time within a day', () => {
    expect(days.map((d) => d.date)).toEqual(['2026-11-03', '2026-11-04'])
    expect(days[1]!.events.map((e) => e.uid)).toEqual(['talk', 'late'])
  })

  it('places each event on the day track between 08 and 22', () => {
    expect(days[0]!.track).toEqual([4 / 14])
    expect(days[1]!.track[1]).toBeCloseTo(11 / 14)
  })
})

describe('nowAndNext', () => {
  it('finds the running event and the next to start', () => {
    const at = Instant.parse('2026-11-04T16:30:00.000Z') // 17:30 in Oslo
    const { now, next } = nowAndNext(days, at)
    expect(now.map((e) => e.uid)).toEqual(['talk'])
    expect(next?.uid).toBe('late')
  })

  it('has nothing after the last event', () => {
    expect(nowAndNext(days, Instant.parse('2026-12-01T12:00:00.000Z'))).toEqual(
      {
        now: [],
        next: null,
      },
    )
  })
})

describe('initialDay', () => {
  it('opens on today or the next day with events, else the last day', () => {
    expect(initialDay(days, Instant.parse('2026-11-04T08:00:00.000Z'))).toBe(
      '2026-11-04',
    )
    expect(initialDay(days, Instant.parse('2026-10-25T08:00:00.000Z'))).toBe(
      '2026-11-03',
    )
    expect(initialDay(days, Instant.parse('2026-12-25T08:00:00.000Z'))).toBe(
      '2026-11-04',
    )
    expect(initialDay([], Instant.parse('2026-12-25T08:00:00.000Z'))).toBeNull()
  })
})

describe('isOver', () => {
  it('compares the end with now', () => {
    expect(isOver(events.kick, Instant.parse('2026-11-03T14:00:00.000Z'))).toBe(
      true,
    )
    expect(isOver(events.talk, Instant.parse('2026-11-03T14:00:00.000Z'))).toBe(
      false,
    )
  })
})

describe('standMapsByDay', () => {
  it('keys the stand maps by date', () => {
    expect(
      standMapsByDay([{ date: '2026-11-04', url: 'u' }]).get('2026-11-04'),
    ).toBe('u')
    expect(standMapsByDay(null).size).toBe(0)
  })
})

describe('upcomingDays', () => {
  it('lists today and later, or everything when nothing is coming up', () => {
    expect(
      upcomingDays(days, Instant.parse('2026-11-04T08:00:00.000Z')).map(
        (d) => d.date,
      ),
    ).toEqual(['2026-11-04'])
    expect(
      upcomingDays(days, Instant.parse('2026-12-01T08:00:00.000Z')),
    ).toHaveLength(2)
  })
})
