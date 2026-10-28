import { describe, expect, it } from 'vitest'
import {
  emptyRoster,
  placeOf,
  promoteWaiting,
  register,
  removeUsers,
  withdraw,
} from '@/domain/event/roster'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'

const at = Instant.parse('2026-08-05T10:00:00.000Z')
const [ada, bo, cy, di] = ['ada', 'bo', 'cy', 'di'].map(UserUid.parse)
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
    const { roster, outcome } = withdraw(queued.roster, oneSpot, ada, at)
    expect(outcome).toEqual({ kind: 'withdrawn', promoted: bo })
    expect([...roster.attendants.keys()]).toEqual([bo])
    expect(roster.queue).toEqual([cy])
  })

  it('promotes nobody while the event is still full after a lowered limit', () => {
    const two = { attendanceLimit: 2 }
    let roster = emptyRoster()
    for (const user of [ada, bo, cy])
      roster = register(roster, two, user, at).roster
    // the limit drops to one after all three asked: ada and bo attend, cy waits
    const { roster: after, outcome } = withdraw(roster, oneSpot, ada, at)
    expect(outcome).toEqual({ kind: 'withdrawn', promoted: null })
    expect([...after.attendants.keys()]).toEqual([bo])
    expect(after.queue).toEqual([cy])
  })

  it('frees the spot when nobody is waiting', () => {
    const { roster, outcome } = withdraw(full(), oneSpot, ada, at)
    expect(outcome).toEqual({ kind: 'withdrawn', promoted: null })
    expect(roster.attendants.size).toBe(0)
  })

  it('takes a queued user out of the queue only', () => {
    const queued = register(full(), oneSpot, bo, at).roster
    const { roster, outcome } = withdraw(queued, oneSpot, bo, at)
    expect(outcome).toEqual({ kind: 'dequeued' })
    expect(roster.queue).toEqual([])
    expect(roster.attendants.has(ada)).toBe(true)
  })

  it('reports a user who was never on the roster', () => {
    expect(withdraw(full(), oneSpot, bo, at).outcome).toEqual({
      kind: 'not-registered',
    })
  })

  it('leaves the original roster unchanged', () => {
    const before = full()
    withdraw(before, oneSpot, ada, at)
    expect(before.attendants.has(ada)).toBe(true)
  })
})

describe('promoteWaiting', () => {
  const later = Instant.parse('2026-08-06T10:00:00.000Z')
  // one spot taken, two waiting
  const waiting = () =>
    register(register(full(), oneSpot, bo, at).roster, oneSpot, cy, at).roster

  it('fills spots added after the event filled up, first in line first', () => {
    const { roster, outcome } = promoteWaiting(
      waiting(),
      { attendanceLimit: 2 },
      later,
    )
    expect(outcome).toEqual({ promoted: [bo] })
    expect([...roster.attendants.keys()]).toEqual([ada, bo])
    expect(roster.attendants.get(bo)?.registeredAt).toBe(later)
    expect(roster.queue).toEqual([cy])
  })

  it('empties the queue when there is room for everyone', () => {
    const unlimited = promoteWaiting(
      waiting(),
      { attendanceLimit: null },
      later,
    )
    expect(unlimited.outcome).toEqual({ promoted: [bo, cy] })
    expect(unlimited.roster.queue).toEqual([])
  })

  it('returns the same roster when nobody can move up', () => {
    const roster = waiting()
    expect(promoteWaiting(roster, oneSpot, later)).toEqual({
      roster,
      outcome: { promoted: [] },
    })
    expect(promoteWaiting(roster, oneSpot, later).roster).toBe(roster)
  })
})

describe('removeUsers', () => {
  const start = Instant.parse('2026-09-01T16:00:00.000Z')
  const after = Instant.parse('2026-09-02T10:00:00.000Z')
  const workshop = { start, registration: { attendanceLimit: 1 } } as const
  // ada attends, bo, cy and di wait in that order
  const waiting = () =>
    [bo, cy, di].reduce(
      (roster, user) => register(roster, oneSpot, user, at).roster,
      full(),
    )

  it('promotes the first in the queue who stays, before the event starts', () => {
    const roster = removeUsers(waiting(), workshop, new Set([ada, bo]), at)
    expect([...roster.attendants.keys()]).toEqual([cy])
    expect(roster.queue).toEqual([di])
  })

  it('promotes nobody once the event has started', () => {
    const roster = removeUsers(waiting(), workshop, new Set([ada, cy]), after)
    expect(roster.attendants.size).toBe(0)
    expect(roster.queue).toEqual([bo, di])
  })

  it('promotes nobody on an event without sign-up', () => {
    const roster = removeUsers(waiting(), { start }, new Set([ada]), at)
    expect(roster.attendants.size).toBe(0)
    expect(roster.queue).toEqual([bo, cy, di])
  })

  it('leaves a roster without the users as it was', () => {
    const roster = removeUsers(full(), workshop, new Set([bo]), at)
    expect([...roster.attendants.keys()]).toEqual([ada])
    expect(roster.queue).toEqual([])
  })
})

describe('placeOf', () => {
  it('says whether a user is coming, waiting at which position, or neither', () => {
    const [ada, bo, cy] = ['ada', 'bo', 'cy'].map(UserUid.parse)
    const roster = {
      attendants: new Map([
        [
          ada,
          {
            attended: true,
            registeredAt: Instant.parse('2026-10-27T12:00:00.000Z'),
          },
        ],
      ]),
      queue: [cy, bo],
    }

    expect(placeOf(roster, ada)).toEqual({ kind: 'attending', attended: true })
    expect(placeOf(roster, bo)).toEqual({ kind: 'queued', position: 2 })
    expect(placeOf(roster, UserUid.parse('dan'))).toBeNull()
  })
})
