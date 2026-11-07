import { describe, expect, it } from 'vitest'
import {
  listStandMaps,
  putStandMap,
  removeStandMap,
} from '@/application/fair/standMaps'
import type { ImageProcessor } from '@/application/files/imageProcessor'
import type { Subject } from '@/domain/authorization/subject'
import { FairDay } from '@/domain/fair/day'
import { STAND_MAP } from '@/domain/fair/standMap'
import { FILE_RULES } from '@/domain/files/file'
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
const now = Instant.parse('2026-10-25T10:00:00.000Z')
const tuesday = FairDay.parse('2026-11-03')

/** Stands in for sharp: anything starting with "IMG" is a picture */
const images: ImageProcessor = {
  fit: () => Promise.resolve(null),
  trim: () => Promise.resolve(null),
  shrink: (bytes, { maxSide }) =>
    Promise.resolve(
      new TextDecoder().decode(bytes).startsWith('IMG')
        ? {
            bytes: new TextEncoder().encode(`WEBP ${maxSide}`),
            contentType: 'image/webp',
          }
        : null,
    ),
}

const setup = () => {
  const storage = memoryFileStorage()
  return {
    files: memoryFileRepository(),
    storage,
    standMaps: memoryStandMapIndex(),
    images,
    now: () => Instant.parse('2026-10-25T10:00:00.000Z'),
  }
}

const png = (name = 'kart.png') => ({
  name,
  contentType: 'image/png',
  bytes: new TextEncoder().encode('IMG'),
})

describe('putStandMap', () => {
  it('stores the map shrunk to WebP as a fair file and lists it under its day', async () => {
    const deps = setup()
    const map = await putStandMap(deps, {
      subject: admin,
      now,
      day: tuesday,
      ...png(),
    })

    expect(map).toMatchObject({ day: tuesday, name: 'kart.png' })
    expect(map.url).toMatch(/^memory:\/\/fair\/standmaps\/.+\.webp$/)
    expect(
      new TextDecoder().decode(
        deps.storage.files.get(map.url.replace('memory://', ''))?.bytes,
      ),
    ).toBe(`WEBP ${STAND_MAP.maxSide}`)
    expect(await listStandMaps(deps)).toEqual([map])
  })

  it('refuses a map it cannot read or over the size limit, and keeps the old one', async () => {
    const deps = setup()
    const kept = await putStandMap(deps, {
      subject: admin,
      now,
      day: tuesday,
      ...png(),
    })
    await expect(
      putStandMap(deps, {
        subject: admin,
        now,
        day: tuesday,
        ...png(),
        bytes: new TextEncoder().encode('not a picture'),
      }),
    ).rejects.toMatchObject({ code: 'standmap/unreadable-image' })
    await expect(
      putStandMap(deps, {
        subject: admin,
        now,
        day: tuesday,
        ...png(),
        bytes: new Uint8Array(FILE_RULES.standmap.maxBytes + 1),
      }),
    ).rejects.toMatchObject({ code: 'file/too-large' })
    expect(await listStandMaps(deps)).toEqual([kept])
  })

  it('replaces the day’s map and removes the old file', async () => {
    const deps = setup()
    const first = await putStandMap(deps, {
      subject: admin,
      now,
      day: tuesday,
      ...png('a.png'),
    })
    const second = await putStandMap(deps, {
      subject: admin,
      now,
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
      putStandMap(deps, {
        subject: subject('user'),
        now,
        day: tuesday,
        ...png(),
      }),
    ).rejects.toMatchObject({ code: 'auth/forbidden' })
    await expect(
      putStandMap(deps, {
        subject: admin,
        now,
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
    await putStandMap(deps, { subject: admin, now, day: tuesday, ...png() })
    await removeStandMap(deps, { subject: admin, now, day: tuesday })

    expect(await listStandMaps(deps)).toEqual([])
    expect(deps.storage.files.size).toBe(0)
  })

  it('says when the day has no map, and refuses non-admins', async () => {
    const deps = setup()
    await expect(
      removeStandMap(deps, { subject: admin, now, day: tuesday }),
    ).rejects.toMatchObject({ code: 'standmap/not-found' })
    await expect(
      removeStandMap(deps, { subject: subject('company'), now, day: tuesday }),
    ).rejects.toMatchObject({ code: 'auth/forbidden' })
  })
})
