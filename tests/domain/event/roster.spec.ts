import { describe, expect, it } from 'vitest'
import { emptyRoster, register, withdraw } from '@/domain/event/roster'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'

const at = Instant.parse('2026-08-05T10:00:00.000Z')
const [ada, bo, cy] = ['ada', 'bo', 'cy'].map(UserUid.parse)
const oneSpot = { attendanceLimit: 1 }

const full = () => register(emptyRoster(), oneSpot, ada, at).roster

describe('register', () => {
  it('gives a spot while there is room', () => {
    const { roster, outcome } = register(emptyRoster(), oneSpot, ada, at)
    expect(outcome).toEqual({ kind: 'registered' })
    expect(roster.attendants.get(ada)).toEqual({
      attended: false,
      registeredAt: at,
    })
  })

  it('queues in order once the event is full', () => {
    const first = register(full(), oneSpot, bo, at)
    const second = register(first.roster, oneSpot, cy, at)
    expect(first.outcome).toEqual({ kind: 'queued', position: 1 })
    expect(second.outcome).toEqual({ kind: 'queued', position: 2 })
    expect(second.roster.queue).toEqual([bo, cy])
  })

  it('never takes the same user twice', () => {
    expect(register(full(), oneSpot, ada, at).outcome).toEqual({
      kind: 'already-registered',
    })
    const queued = register(full(), oneSpot, bo, at).roster
    expect(register(queued, oneSpot, bo, at).outcome).toEqual({
      kind: 'already-queued',
    })
  })

  it('has no limit without an attendance limit', () => {
    const roster = register(full(), { attendanceLimit: null }, bo, at)
    expect(roster.outcome).toEqual({ kind: 'registered' })
  })
})

describe('withdraw', () => {
  it('moves the first in the queue into the freed spot', () => {
    const queued = register(
      register(full(), oneSpot, bo, at).roster,
      oneSpot,
      cy,
      at,
    )
    const { roster, outcome } = withdraw(queued.roster, ada, at)
    expect(outcome).toEqual({ kind: 'withdrawn', promoted: bo })
    expect([...roster.attendants.keys()]).toEqual([bo])
    expect(roster.queue).toEqual([cy])
  })

  it('frees the spot when nobody is waiting', () => {
    const { roster, outcome } = withdraw(full(), ada, at)
    expect(outcome).toEqual({ kind: 'withdrawn', promoted: null })
    expect(roster.attendants.size).toBe(0)
  })

  it('takes a queued user out of the queue only', () => {
    const queued = register(full(), oneSpot, bo, at).roster
    const { roster, outcome } = withdraw(queued, bo, at)
    expect(outcome).toEqual({ kind: 'dequeued' })
    expect(roster.queue).toEqual([])
    expect(roster.attendants.has(ada)).toBe(true)
  })

  it('reports a user who was never on the roster', () => {
    expect(withdraw(full(), bo, at).outcome).toEqual({ kind: 'not-registered' })
  })

  it('leaves the original roster unchanged', () => {
    const before = full()
    withdraw(before, ada, at)
    expect(before.attendants.has(ada)).toBe(true)
  })
})
