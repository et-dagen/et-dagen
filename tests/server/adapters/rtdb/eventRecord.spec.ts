import { describe, expect, it } from 'vitest'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'
import {
  rosterOf,
  rosterRecord,
  toStoredEvent,
  type EventRecord,
} from '@/server/adapters/rtdb/eventRecord'

// The shape POST /api/v1/event writes, plus a roster as the register endpoints leave it
const workshop: EventRecord = {
  companyUID: 'company',
  capacity: 2,
  date: { start: '2026-09-01T18:00', end: '2026-09-01T20:00' },
  description: 'Hands-on',
  location: { name: 'EL5', map: null },
  title: 'Workshop',
  registration: {
    start: '2026-08-20T12:00',
    end: '2026-08-31T23:59',
    requirements: { programmes: ['MTEL'], years: [3, 4] },
  },
  attendants: { ada: { attended: true, registeredAt: 1787400000000 } },
  queue: { 1787400000002: 'cy', 1787400000001: 'bo' },
}

const [ada, bo, cy, dee] = ['ada', 'bo', 'cy', 'dee'].map(UserUid.parse)

describe('toStoredEvent', () => {
  const { event, roster } = toStoredEvent('workshop', workshop)

  it('reads Oslo wall-clock times as instants', () => {
    // 18:00 in Oslo is 16:00 UTC in summer time
    expect(event.start).toBe('2026-09-01T16:00:00.000Z')
    expect(event.registration?.period).toEqual({
      start: Instant.parse('2026-08-20T10:00:00.000Z'),
      duration: Instant.durationSince(
        Instant.parse('2026-08-31T21:59:00.000Z'),
        Instant.parse('2026-08-20T10:00:00.000Z'),
      ),
    })
  })

  it('reads capacity and requirements as the registration terms', () => {
    expect(event.registration?.attendanceLimit).toBe(2)
    expect(event.registration?.eligibility).toEqual({
      kind: 'and',
      rules: [
        { kind: 'programme', programmes: ['MTEL'] },
        { kind: 'year', years: [3, 4] },
      ],
    })
  })

  it('orders the queue by key', () => {
    expect(roster.queue).toEqual([bo, cy])
    expect(roster.attendants.get(ada)).toEqual({
      attended: true,
      registeredAt: new Date(1787400000000).toISOString(),
    })
  })

  it('has no registration when there is no capacity, as v1 treats it', () => {
    for (const capacity of [0, null, undefined]) {
      const stored = toStoredEvent('talk', { ...workshop, capacity })
      expect(stored.event.registration).toBeUndefined()
    }
  })

  it('drops study years outside 1–5 and omits empty requirements', () => {
    const record = {
      ...workshop,
      registration: {
        ...workshop.registration,
        requirements: { years: [0, 6, 2] },
      },
    }
    expect(toStoredEvent('w', record).event.registration?.eligibility).toEqual({
      kind: 'year',
      years: [2],
    })
    const open = {
      ...workshop,
      registration: { start: '2026-08-20T12:00', end: '2026-08-31T23:59' },
    }
    expect(toStoredEvent('w', open).event.registration).not.toHaveProperty(
      'eligibility',
    )
  })

  it('refuses a record without the times the domain needs', () => {
    expect(() => toStoredEvent('w', { ...workshop, date: {} })).toThrow(
      RangeError,
    )
    expect(() =>
      toStoredEvent('w', { ...workshop, registration: null }),
    ).toThrow(RangeError)
  })
})

describe('rosterRecord', () => {
  const keys = new Map([
    [bo, '1787400000001'],
    [cy, '1787400000002'],
  ])
  const at = Instant.parse('2026-08-21T10:00:00.000Z')

  it('round-trips a roster v1 wrote', () => {
    const record = rosterRecord(rosterOf(workshop), keys, at)
    expect(record).toEqual({
      attendants: workshop.attendants,
      queue: workshop.queue,
    })
  })

  it('gives a new queue entry a key after every existing one', () => {
    const roster = rosterOf(workshop)
    const record = rosterRecord(
      { ...roster, queue: [...roster.queue, dee] },
      keys,
      Instant.sub(at, Duration.fromDays(365)),
    )
    expect(record.queue).toMatchObject({ 1787400000003: 'dee' })
    expect(rosterOf({ queue: record.queue }).queue).toEqual([bo, cy, dee])
  })

  it('keys a first queue entry by when it joined', () => {
    const record = rosterRecord(
      { attendants: new Map(), queue: [dee] },
      new Map(),
      at,
    )
    expect(record.queue).toEqual({
      [String(Instant.toDate(at).getTime())]: 'dee',
    })
  })
})
