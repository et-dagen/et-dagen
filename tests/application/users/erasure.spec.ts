import { describe, expect, it } from 'vitest'
import type { StoredEvent } from '@/application/events/eventRepository'
import { eraseUsers } from '@/application/users/erasure'
import { CompanyUid } from '@/domain/business/company'
import { EventUid } from '@/domain/event/event'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'
import { memoryEventRepository } from '@/server/adapters/memory/eventRepository'
import { memoryUserStore } from '@/server/adapters/memory/userStore'

const now = Instant.parse('2026-08-05T10:00:00.000Z')
const [gone, kept] = ['gone', 'kept'].map(UserUid.parse)

const workshop: StoredEvent = {
  event: {
    uid: EventUid.parse('workshop'),
    companyUid: CompanyUid.parse('company'),
    start: Instant.parse('2026-09-01T16:00:00.000Z'),
    registration: {
      period: { start: now, duration: Duration.fromDays(14) },
      attendanceLimit: 1,
    },
  },
  roster: { attendants: new Map(), queue: [] },
}

function setup() {
  const ports = {
    files: memoryUserStore([gone, kept]),
    events: memoryEventRepository([workshop]),
    profiles: memoryUserStore([gone, kept]),
    accounts: memoryUserStore([gone, kept]),
  }
  return ports
}

describe('eraseUsers', () => {
  it('removes the files, the event places, the profile and the account', async () => {
    const ports = setup()
    await ports.events.registerOrQueue(workshop.event.uid, gone, now)
    await ports.events.registerOrQueue(workshop.event.uid, kept, now)

    await eraseUsers(ports, [gone], now)

    for (const store of [ports.files, ports.profiles, ports.accounts]) {
      expect(store.has(gone)).toBe(false)
      expect(store.has(kept)).toBe(true)
    }
    const found = await ports.events.find(workshop.event.uid)
    expect([...(found?.roster.attendants.keys() ?? [])]).toEqual([kept])
  })

  it('keeps the account until everything else is gone, so it can be repeated', async () => {
    const ports = setup()
    const profiles = ports.profiles
    ports.profiles = {
      ...profiles,
      remove: () => Promise.reject(new Error('database unavailable')),
    }

    await expect(eraseUsers(ports, [gone], now)).rejects.toThrow(
      'database unavailable',
    )
    expect(ports.accounts.has(gone)).toBe(true)

    ports.profiles = profiles
    await eraseUsers(ports, [gone], now)
    expect(ports.accounts.has(gone)).toBe(false)
    expect(profiles.has(gone)).toBe(false)
  })
})
