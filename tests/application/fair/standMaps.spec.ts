import { describe, expect, it } from 'vitest'
import {
  listStandMaps,
  putStandMap,
  removeStandMap,
} from '@/application/fair/standMaps'
import type { Subject } from '@/domain/authorization/subject'
import { FairDay } from '@/domain/fair/day'
import { Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryFileStorage } from '@/server/adapters/memory/fileStorage'
import { memoryStandMapIndex } from '@/server/adapters/memory/standMapIndex'

const subject = (role: Role): Subject => ({
  uid: UserUid.parse(`${role}-1`),
  roles: [role],
  companies: new Map(),
  applicant: null,
})
const admin = subject('admin')
const tuesday = FairDay.parse('2026-11-03')

const setup = () => {
  const storage = memoryFileStorage()
  return {
    files: memoryFileRepository(),
    storage,
    standMaps: memoryStandMapIndex(),
    now: () => Instant.parse('2026-10-25T10:00:00.000Z'),
  }
}

const png = (name = 'kart.png') => ({
  name,
  contentType: 'image/png',
  bytes: new Uint8Array([1, 2, 3]),
})

describe('putStandMap', () => {
  it('stores the map as a fair file and lists it under its day', async () => {
    const deps = setup()
    const map = await putStandMap(deps, {
      subject: admin,
      day: tuesday,
      ...png(),
    })

    expect(map).toMatchObject({ day: tuesday, name: 'kart.png' })
    expect(map.url).toMatch(/^memory:\/\/fair\/standmaps\/.+\.png$/)
    expect(await listStandMaps(deps)).toEqual([map])
  })

  it('replaces the day’s map and removes the old file', async () => {
    const deps = setup()
    const first = await putStandMap(deps, {
      subject: admin,
      day: tuesday,
      ...png('a.png'),
    })
    const second = await putStandMap(deps, {
      subject: admin,
      day: tuesday,
      ...png('b.png'),
    })

    expect(await listStandMaps(deps)).toEqual([second])
    expect([...deps.storage.files.keys()]).toEqual([
      second.url.replace('memory://', ''),
    ])
    expect(first.url).not.toBe(second.url)
  })

  it('refuses anyone who is not an admin, and formats other than images', async () => {
    const deps = setup()
    await expect(
      putStandMap(deps, { subject: subject('user'), day: tuesday, ...png() }),
    ).rejects.toMatchObject({ code: 'standmap/forbidden' })
    await expect(
      putStandMap(deps, {
        subject: admin,
        day: tuesday,
        ...png('kart.pdf'),
        contentType: 'application/pdf',
      }),
    ).rejects.toMatchObject({ code: 'file/unsupported-type' })
    expect(await listStandMaps(deps)).toEqual([])
  })
})

describe('removeStandMap', () => {
  it('removes the day’s map and its file', async () => {
    const deps = setup()
    await putStandMap(deps, { subject: admin, day: tuesday, ...png() })
    await removeStandMap(deps, { subject: admin, day: tuesday })

    expect(await listStandMaps(deps)).toEqual([])
    expect(deps.storage.files.size).toBe(0)
  })

  it('says when the day has no map, and refuses non-admins', async () => {
    const deps = setup()
    await expect(
      removeStandMap(deps, { subject: admin, day: tuesday }),
    ).rejects.toMatchObject({ code: 'standmap/not-found' })
    await expect(
      removeStandMap(deps, { subject: subject('company'), day: tuesday }),
    ).rejects.toMatchObject({ code: 'standmap/forbidden' })
  })
})
