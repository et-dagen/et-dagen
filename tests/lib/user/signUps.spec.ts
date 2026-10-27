import { describe, expect, it } from 'vitest'
import {
  firstNameOf,
  signUpRows,
  ticketOf,
  type SignUp,
} from '@/lib/user/signUps'

const events = {
  talk: { title: 'Bedriftspresentasjon: Sony' },
  workshop: { title: 'Workshop: Nordic Semiconductor' },
}

const signUps: SignUp[] = [
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
    expect(signUpRows(signUps, events).map((row) => row.event.title)).toEqual([
      'Workshop: Nordic Semiconductor',
      'Bedriftspresentasjon: Sony',
    ])
  })

  it('drops a sign-up whose event is gone', () => {
    expect(signUpRows(signUps, events).some((r) => r.eventUID === 'gone')).toBe(
      false,
    )
  })

  it('copes with nothing loaded yet', () => {
    expect(signUpRows(null, null)).toEqual([])
  })
})

describe('ticketOf', () => {
  it('is the soonest event with a place, skipping the waiting list', () => {
    expect(ticketOf(signUpRows(signUps, events))?.eventUID).toBe('talk')
  })

  it('is nothing when every sign-up is queued', () => {
    expect(ticketOf(signUpRows(signUps.slice(0, 1), events))).toBeNull()
  })
})

describe('firstNameOf', () => {
  it('takes the first name', () => {
    expect(firstNameOf(' Ingrid  Testesen ')).toBe('Ingrid')
    expect(firstNameOf(undefined)).toBe('')
  })
})
