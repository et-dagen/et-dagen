/**
 * What every {@link EventRepository} adapter must do
 *
 * An adapter's test file calls {@link describeEventRepository} with a factory. The suite is not
 * a test file itself, so it runs once per adapter.
 */
import { describe, expect, it } from 'vitest'
import type {
  EventRepository,
  StoredEvent,
} from '@/application/events/eventRepository'
import { CompanyUid } from '@/domain/business/company'
import { EventUid } from '@/domain/event/event'
import { emptyRoster } from '@/domain/event/roster'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'

const at = Instant.parse('2026-08-05T10:00:00.000Z')
const later = Instant.parse('2026-08-06T10:00:00.000Z')
const users = Array.from({ length: 10 }, (_, i) => UserUid.parse(`user-${i}`))
const [ada, bo, cy] = users

const event = (
  uid: string,
  attendanceLimit: number | null = 1,
): StoredEvent => ({
  event: {
    uid: EventUid.parse(uid),
    companyUid: CompanyUid.parse('company'),
    start: Instant.parse('2026-09-01T16:00:00.000Z'),
    registration: {
      period: { start: at, duration: Duration.fromDays(14) },
      attendanceLimit,
    },
  },
  roster: emptyRoster(),
})

const talk: StoredEvent = {
  event: { ...event('talk').event, registration: undefined },
  roster: emptyRoster(),
}

const uid = EventUid.parse

export function describeEventRepository(
  adapter: string,
  make: (seed: StoredEvent[]) => Promise<EventRepository> | EventRepository,
) {
  describe(`${adapter} EventRepository`, () => {
    it('finds a stored event and its roster', async () => {
      const repository = await make([event('workshop')])
      await repository.registerOrQueue(uid('workshop'), ada, at)

      const found = await repository.find(uid('workshop'))
      expect(found?.event.uid).toBe('workshop')
      expect(found?.roster.attendants.get(ada)).toEqual({
        attended: false,
        registeredAt: at,
      })
    })

    it('finds nothing for an unknown uid', async () => {
      const repository = await make([])
      expect(await repository.find(uid('missing'))).toBeNull()
    })

    it('registers, then queues in order once full', async () => {
      const repository = await make([event('workshop')])
      expect(
        await repository.registerOrQueue(uid('workshop'), ada, at),
      ).toEqual({
        kind: 'registered',
      })
      expect(await repository.registerOrQueue(uid('workshop'), bo, at)).toEqual(
        {
          kind: 'queued',
          position: 1,
        },
      )
      expect(await repository.registerOrQueue(uid('workshop'), bo, at)).toEqual(
        {
          kind: 'already-queued',
        },
      )
      const found = await repository.find(uid('workshop'))
      expect(found?.roster.queue).toEqual([bo])
    })

    it('moves the first in the queue up when an attendant withdraws', async () => {
      const repository = await make([event('workshop')])
      for (const user of [ada, bo, cy]) {
        await repository.registerOrQueue(uid('workshop'), user, at)
      }

      expect(await repository.withdraw(uid('workshop'), ada, later)).toEqual({
        kind: 'withdrawn',
        promoted: bo,
      })
      const found = await repository.find(uid('workshop'))
      expect([...(found?.roster.attendants.keys() ?? [])]).toEqual([bo])
      expect(found?.roster.attendants.get(bo)?.registeredAt).toBe(later)
      expect(found?.roster.queue).toEqual([cy])
    })

    it('admits exactly the limit when users register at once', async () => {
      const repository = await make([event('workshop', 3)])
      const outcomes = await Promise.all(
        users.map((user) =>
          repository.registerOrQueue(uid('workshop'), user, at),
        ),
      )

      expect(outcomes.filter((o) => o.kind === 'registered')).toHaveLength(3)
      const positions = outcomes
        .flatMap((o) => (o.kind === 'queued' ? [o.position] : []))
        .sort((a, b) => a - b)
      expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7])

      const found = await repository.find(uid('workshop'))
      expect(found?.roster.attendants.size).toBe(3)
      expect(found?.roster.queue).toHaveLength(7)
    })

    it('reports a missing event or one without sign-up', async () => {
      const repository = await make([talk])
      for (const operation of ['registerOrQueue', 'withdraw'] as const) {
        expect(await repository[operation](uid('missing'), ada, at)).toEqual({
          kind: 'event-not-found',
        })
        expect(await repository[operation](uid('talk'), ada, at)).toEqual({
          kind: 'no-registration',
        })
      }
    })

    it('reports withdrawing a user who never registered', async () => {
      const repository = await make([event('workshop')])
      expect(await repository.withdraw(uid('workshop'), ada, at)).toEqual({
        kind: 'not-registered',
      })
    })
  })
}
