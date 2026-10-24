import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time'
import { eventStatus, placeOf, type EventRow } from '@/lib/admin/events'

// 12:00 in Oslo on 1 November 2026
const now = Instant.parse('2026-11-01T11:00:00.000Z')

const workshop: EventRow = {
  capacity: 2,
  date: { start: '2026-11-04T17:15', end: '2026-11-04T19:00' },
  registration: { start: '2026-10-20T12:00', end: '2026-11-03T23:59' },
}

describe('placeOf', () => {
  it('splits a building code from the room name', () => {
    expect(placeOf('EL5, Elektrobygget')).toEqual({
      code: 'EL5',
      name: 'Elektrobygget',
    })
    expect(placeOf('KJL1 Kjelhuset')).toEqual({
      code: 'KJL1',
      name: 'Kjelhuset',
    })
    expect(placeOf('R1')).toEqual({ code: 'R1', name: '' })
  })

  it('leaves names without a code alone', () => {
    expect(placeOf('Gamle fysikk, auditorium')).toEqual({
      code: null,
      name: 'Gamle fysikk, auditorium',
    })
    expect(placeOf(undefined)).toEqual({ code: null, name: '' })
  })
})

describe('eventStatus', () => {
  it('is open while sign-up runs and there is room', () => {
    expect(eventStatus(workshop, now)).toEqual({ kind: 'open' })
  })

  it('is full when every place is taken, counting the queue', () => {
    const full = {
      ...workshop,
      attendants: { a: {}, b: {} },
      queue: { 1: 'c', 2: 'd' },
    }
    expect(eventStatus(full, now)).toEqual({ kind: 'full', queued: 2 })
  })

  it('follows the sign-up window in Oslo time', () => {
    const later = { ...workshop, registration: { start: '2026-11-01T12:30' } }
    expect(eventStatus(later, now)).toEqual({ kind: 'not-open' })
    const ended = {
      ...workshop,
      registration: { start: '2026-10-01T12:00', end: '2026-11-01T11:59' },
    }
    expect(eventStatus(ended, now)).toEqual({ kind: 'closed' })
  })

  it('has no sign-up without a capacity', () => {
    expect(eventStatus({ ...workshop, capacity: null }, now)).toEqual({
      kind: 'no-registration',
    })
  })

  it('is past once the event has ended', () => {
    const past = { ...workshop, date: { start: '2026-03-12T17:00' } }
    expect(eventStatus(past, now)).toEqual({ kind: 'past' })
  })
})
