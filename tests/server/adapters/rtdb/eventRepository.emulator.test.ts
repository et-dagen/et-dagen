/**
 * Runs the EventRepository contract against the Realtime Database emulator
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe, expect, it } from 'vitest'
import { describeEventRepository } from '@/tests/application/events/eventRepository.contract'
import type { StoredEvent } from '@/application/events/eventRepository'
import { CompanyUid } from '@/domain/business/company'
import { EventUid } from '@/domain/event/event'
import { emptyRoster } from '@/domain/event/roster'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'
import { endOf } from '@/domain/time/interval'
import { TimeZone, Zone } from '@/domain/time/zone'
import { UserUid } from '@/domain/user'
import type { EventRecord } from '@/server/adapters/rtdb/eventRecord'
import { rtdbEventRepository } from '@/server/adapters/rtdb/eventRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST
const OSLO = TimeZone.parse('Europe/Oslo')

/** A stored event as v1 would have written it */
const recordOf = ({ event }: StoredEvent): EventRecord => ({
  companyUID: event.companyUid,
  capacity: event.registration?.attendanceLimit ?? null,
  date: { start: Zone.toInput(event.start, OSLO) },
  registration: event.registration
    ? {
        start: Zone.toInput(event.registration.period.start, OSLO),
        end: Zone.toInput(endOf(event.registration.period), OSLO),
      }
    : null,
})

const client = (name: string) =>
  getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      name,
    ),
  )

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = client('event-repository-contract')

  describeEventRepository('rtdb', async (seed) => {
    await db
      .ref('events')
      .set(Object.fromEntries(seed.map((s) => [s.event.uid, recordOf(s)])))
    return rtdbEventRepository(db)
  })

  // One client queues its own transactions, so the race that matters is between two servers
  it('admits exactly the limit when two servers race', async () => {
    const at = Instant.parse('2026-08-05T10:00:00.000Z')
    const workshop: StoredEvent = {
      event: {
        uid: EventUid.parse('race'),
        companyUid: CompanyUid.parse('company'),
        start: Instant.parse('2026-09-01T16:00:00.000Z'),
        registration: {
          period: { start: at, duration: Duration.fromDays(14) },
          attendanceLimit: 3,
        },
      },
      roster: emptyRoster(),
    }
    await db.ref('events').set({ race: recordOf(workshop) })
    const servers = [db, client('second-server')].map(rtdbEventRepository)

    const outcomes = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        servers[i % 2].registerOrQueue(
          EventUid.parse('race'),
          UserUid.parse(`user-${i}`),
          at,
        ),
      ),
    )

    expect(outcomes.filter((o) => o.kind === 'registered')).toHaveLength(3)
    const stored = await servers[0].find(EventUid.parse('race'))
    expect(stored?.roster.attendants.size).toBe(3)
    expect(new Set(stored?.roster.queue).size).toBe(9)
  })
})
