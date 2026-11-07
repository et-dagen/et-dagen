import { describe, expect, it } from 'vitest'
import type { StoredEvent } from '@/application/events/eventRepository'
import { eraseUsers } from '@/application/users/erasure'
import { CompanyUid } from '@/domain/business/company'
import {
  InvitationId,
  type Invitation,
  type TokenHash,
} from '@/domain/business/invitation'
import { EmailAddress } from '@/domain/email'
import { EventUid } from '@/domain/event/event'
import { Duration } from '@/domain/time/duration'
import { Instant } from '@/domain/time/instant'
import { FileId, type StoredFile } from '@/domain/files/file'
import { UserUid } from '@/domain/user'
import { memoryEventRepository } from '@/server/adapters/memory/eventRepository'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryInvitationRepository } from '@/server/adapters/memory/invitationRepository'
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
    records: memoryFileRepository([
      file('resume', { kind: 'user', uid: gone }, gone),
      file('resume', { kind: 'user', uid: kept }, kept),
      file('logo', { kind: 'company', uid: CompanyUid.parse('company') }, gone),
    ]),
    events: memoryEventRepository([workshop]),
    invitations: memoryInvitationRepository(),
    profiles: memoryUserStore([gone, kept]),
    accounts: memoryUserStore([gone, kept]),
  }
  return ports
}

const file = (
  kind: StoredFile['kind'],
  owner: StoredFile['owner'],
  uploader: UserUid,
): StoredFile => ({
  id: FileId.random(),
  owner,
  kind,
  uploader,
  name: `${kind}.bin`,
  contentType: kind === 'resume' ? 'application/pdf' : 'image/webp',
  size: 1,
  createdAt: now,
})

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

  it('removes the records of their files, but not of what they uploaded for others', async () => {
    const ports = setup()
    await eraseUsers(ports, [gone], now)

    expect(await ports.records.ofOwner({ kind: 'user', uid: gone })).toEqual([])
    expect(
      await ports.records.ofOwner({ kind: 'user', uid: kept }),
    ).toHaveLength(1)
    const [logo] = await ports.records.ofOwner({
      kind: 'company',
      uid: CompanyUid.parse('company'),
    })
    expect(logo.uploader).toBeNull()
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

  it('removes the invitations they joined by, and keeps the ones others joined by', async () => {
    const ports = setup()
    const joinedBy = (uid: UserUid): Invitation => ({
      id: InvitationId.random(),
      company: CompanyUid.parse('company'),
      email: EmailAddress.parse(`${uid}@company.no`),
      tokenHash: `hash-${uid}` as TokenHash,
      invitedBy: UserUid.parse('admin'),
      createdAt: now,
      expiresAt: now,
      revokedAt: null,
      redeemed: { by: uid, at: now },
    })
    const theirs = joinedBy(gone)
    const others = joinedBy(kept)
    await ports.invitations.save(theirs)
    await ports.invitations.save(others)

    await eraseUsers(ports, [gone], now)

    expect(await ports.invitations.all()).toEqual([others])
  })
})
