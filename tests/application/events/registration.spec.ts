import { describe, expect, it } from 'vitest'
import type { StoredEvent } from '@/application/events/eventRepository'
import {
  registerForEvent,
  withdrawFromEvent,
  type RegistrationRequest,
} from '@/application/events/registration'
import type { EligibilityRule } from '@/domain/authorization/eligibility'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { EventUid } from '@/domain/event/event'
import { emptyRoster, type Roster } from '@/domain/event/roster'
import { Term } from '@/domain/ntnu'
import { Duration, Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryEventRepository } from '@/server/adapters/memory/eventRepository'

const opens = Instant.parse('2026-08-01T10:00:00.000Z')
const open = Instant.parse('2026-08-05T10:00:00.000Z')
const closed = Instant.parse('2026-09-01T10:00:00.000Z')

const subject = (
  uid: string,
  roles: Role[],
  applicant: Subject['applicant'] = null,
): Subject => ({
  uid: UserUid.parse(uid),
  roles,
  companies: new Map(),
  applicant,
})

const ada = subject('ada', ['user'], {
  programme: 'MTEL',
  year: 3,
  graduation: Term.parse('2028-spring'),
})
const bo = subject('bo', ['user'], {
  programme: 'BIELEKTRO',
  year: 1,
  graduation: Term.parse('2029-spring'),
})
const admin = subject('admin', ['admin'])
const host = subject('host', ['company'])

const WORKSHOP = EventUid.parse('workshop')
const TALK = EventUid.parse('talk')

const stored = (
  options: {
    limit?: number
    eligibility?: EligibilityRule
    roster?: Roster
  } = {},
): StoredEvent => ({
  event: {
    uid: WORKSHOP,
    companyUid: CompanyUid.parse('company'),
    start: Instant.parse('2026-09-10T16:00:00.000Z'),
    registration: {
      period: { start: opens, duration: Duration.fromDays(14) },
      attendanceLimit: options.limit ?? 10,
      ...(options.eligibility && { eligibility: options.eligibility }),
    },
  },
  roster: options.roster ?? emptyRoster(),
})

const talk: StoredEvent = {
  event: { ...stored().event, uid: TALK, registration: undefined },
  roster: emptyRoster(),
}

const request = (
  who: Subject,
  overrides: Partial<RegistrationRequest> = {},
): RegistrationRequest => ({
  subject: who,
  event: WORKSHOP,
  user: who.uid,
  now: open,
  ...overrides,
})

describe('registerForEvent', () => {
  it('registers while there is room, then queues', async () => {
    const events = memoryEventRepository([stored({ limit: 1 })])

    expect(await registerForEvent(events, request(ada))).toEqual({
      kind: 'registered',
    })
    expect(await registerForEvent(events, request(bo))).toEqual({
      kind: 'queued',
      position: 1,
    })
  })

  it('reports a missing event, and one without sign-up', async () => {
    const events = memoryEventRepository([talk])

    expect(await registerForEvent(events, request(ada))).toEqual({
      kind: 'event-not-found',
    })
    expect(
      await registerForEvent(events, request(ada, { event: TALK })),
    ).toEqual({ kind: 'no-registration' })
  })

  it('lets only an admin register someone else', async () => {
    const events = memoryEventRepository([stored()])

    expect(
      await registerForEvent(events, request(ada, { user: bo.uid })),
    ).toEqual({ kind: 'not-own' })
    expect(
      await registerForEvent(events, request(admin, { user: bo.uid })),
    ).toEqual({ kind: 'registered' })
  })

  it('refuses outside the registration window, except for an admin', async () => {
    const events = memoryEventRepository([stored()])

    expect(
      await registerForEvent(events, request(ada, { now: closed })),
    ).toEqual({ kind: 'closed' })
    expect(
      await registerForEvent(
        events,
        request(admin, { user: ada.uid, now: closed }),
      ),
    ).toEqual({ kind: 'registered' })
  })

  it('says which part of the rule a student does not meet', async () => {
    const rule: EligibilityRule = { kind: 'programme', programmes: ['MTEL'] }
    const events = memoryEventRepository([stored({ eligibility: rule })])

    expect(await registerForEvent(events, request(bo))).toEqual({
      kind: 'not-eligible',
      verdict: { ok: false, reason: 'unmet', unmet: rule },
    })
    expect(await registerForEvent(events, request(ada))).toEqual({
      kind: 'registered',
    })
  })

  it('refuses a company user', async () => {
    const events = memoryEventRepository([stored()])

    expect(await registerForEvent(events, request(host))).toEqual({
      kind: 'forbidden',
    })
  })

  it('leaves the roster unchanged when it refuses', async () => {
    const events = memoryEventRepository([stored()])
    await registerForEvent(events, request(ada, { now: closed }))

    expect((await events.find(WORKSHOP))?.roster).toEqual(emptyRoster())
  })
})

describe('withdrawFromEvent', () => {
  const full = () =>
    memoryEventRepository([
      stored({
        limit: 1,
        roster: {
          attendants: new Map([
            [ada.uid, { attended: false, registeredAt: opens }],
          ]),
          queue: [bo.uid],
        },
      }),
    ])

  it('frees the spot for the first in the queue', async () => {
    const events = full()

    expect(await withdrawFromEvent(events, request(ada))).toEqual({
      kind: 'withdrawn',
      promoted: bo.uid,
    })
  })

  it('refuses outside the registration window, except for an admin', async () => {
    const events = full()

    expect(
      await withdrawFromEvent(events, request(ada, { now: closed })),
    ).toEqual({ kind: 'closed' })
    expect(
      await withdrawFromEvent(
        events,
        request(admin, { user: ada.uid, now: closed }),
      ),
    ).toEqual({ kind: 'withdrawn', promoted: bo.uid })
  })

  it('lets only an admin take someone else off', async () => {
    expect(
      await withdrawFromEvent(full(), request(bo, { user: ada.uid })),
    ).toEqual({ kind: 'not-own' })
  })

  it('reports a user who holds no place', async () => {
    const events = memoryEventRepository([stored()])

    expect(await withdrawFromEvent(events, request(ada))).toEqual({
      kind: 'not-registered',
    })
  })
})
