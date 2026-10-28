import { describe, expect, it } from 'vitest'
import type { StoredEvent } from '@/application/events/eventRepository'
import { signUpsOf } from '@/application/events/signUps'
import type { Subject } from '@/domain/authorization/subject'
import { CompanyUid } from '@/domain/business/company'
import { EventUid } from '@/domain/event/event'
import { Instant, type ISO8601Literal } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { memoryEventRepository } from '@/server/adapters/memory/eventRepository'

const [ada, bo] = ['ada', 'bo'].map(UserUid.parse)
const now = Instant.parse('2026-10-27T12:00:00.000Z')
const subject: Subject = {
  uid: ada,
  roles: ['user'],
  companies: new Map(),
  applicant: null,
}

const stored = (
  uid: string,
  start: ISO8601Literal,
  attendants: UserUid[],
  queue: UserUid[] = [],
): StoredEvent => ({
  event: {
    uid: EventUid.parse(uid),
    companyUid: CompanyUid.parse('acme'),
    start: Instant.parse(start),
  },
  roster: {
    attendants: new Map(
      attendants.map((user) => [user, { attended: false, registeredAt: now }]),
    ),
    queue,
  },
})

describe('signUpsOf', () => {
  it("lists the caller's places and queue positions, soonest first", async () => {
    const events = memoryEventRepository([
      stored('dinner', '2027-02-10T17:00:00.000Z', [bo], [bo, ada]),
      stored('talk', '2027-02-09T16:15:00.000Z', [ada]),
      stored('other', '2027-02-09T10:00:00.000Z', [bo]),
    ])

    expect(await signUpsOf({ events }, { subject, now })).toEqual([
      {
        event: 'talk',
        start: '2027-02-09T16:15:00.000Z',
        place: { kind: 'attending', attended: false },
      },
      {
        event: 'dinner',
        start: '2027-02-10T17:00:00.000Z',
        place: { kind: 'queued', position: 2 },
      },
    ])
  })

  it('refuses a caller who is not signed in', async () => {
    await expect(
      signUpsOf(
        { events: memoryEventRepository() },
        { subject: undefined, now },
      ),
    ).rejects.toMatchObject({ code: 'auth/signed-out' })
  })
})
