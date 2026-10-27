import { describe, expect, it } from 'vitest'
import { Instant } from '@/domain/time'
import {
  firstNameOf,
  signUpRows,
  ticketOf,
  type SignUp,
} from '@/lib/user/signUps'

const events = {
  talk: {
    title: 'Bedriftspresentasjon: Sony',
    date: { start: '2027-02-09T17:15', end: '2027-02-09T19:00' },
  },
  workshop: {
    title: 'Workshop: Nordic Semiconductor',
    date: { start: '2027-02-09T12:15', end: '2027-02-09T14:00' },
  },
  kickoff: {
    title: 'Kick-off',
    date: { start: '2026-09-01T12:00', end: '2026-09-01T14:00' },
  },
}
const now = Instant.parse('2026-10-27T08:00:00.000Z')

const signUps: SignUp[] = [
  {
    eventUID: 'kickoff',
    start: '2026-09-01T10:00:00.000Z',
    status: 'attending',
  },
  {
    eventUID: 'workshop',
    start: '2027-02-09T11:15:00.000Z',
    status: 'queued',
    position: 3,
  },
  { eventUID: 'talk', start: '2027-02-09T16:15:00.000Z', status: 'attending' },
  { eventUID: 'gone', start: '2027-02-10T10:00:00.000Z', status: 'attending' },
]

describe('signUpRows', () => {
  it('joins each sign-up to its event, in the order given', () => {
    expect(
      signUpRows(signUps, events, now).map((row) => row.event.title),
    ).toEqual(['Workshop: Nordic Semiconductor', 'Bedriftspresentasjon: Sony'])
  })

  it('drops a sign-up whose event has finished', () => {
    expect(
      signUpRows(signUps, events, now).some((r) => r.eventUID === 'kickoff'),
    ).toBe(false)
  })

  it('drops a sign-up whose event is gone', () => {
    expect(
      signUpRows(signUps, events, now).some((r) => r.eventUID === 'gone'),
    ).toBe(false)
  })

  it('copes with nothing loaded yet', () => {
    expect(signUpRows(null, null, now)).toEqual([])
  })
})

describe('ticketOf', () => {
  it('is the soonest event with a place, skipping the waiting list', () => {
    expect(ticketOf(signUpRows(signUps, events, now))?.eventUID).toBe('talk')
  })

  it('is nothing when every sign-up is queued', () => {
    expect(ticketOf(signUpRows(signUps.slice(0, 2), events, now))).toBeNull()
  })
})

describe('firstNameOf', () => {
  it('takes the first name', () => {
    expect(firstNameOf(' Ingrid  Testesen ')).toBe('Ingrid')
    expect(firstNameOf(undefined)).toBe('')
  })
})
