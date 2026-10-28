import { describe, expect, it } from 'vitest'
import {
  addMember,
  listBoard,
  moveMember,
  removeMember,
  setPortrait,
  updateMember,
} from '@/application/board/members'
import type { ImageProcessor } from '@/application/files/imageProcessor'
import type { Subject } from '@/domain/authorization/subject'
import { BoardMemberId, type BoardMemberInput } from '@/domain/board/member'
import { EmailAddress } from '@/domain/email'
import { Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryBoardRepository } from '@/server/adapters/memory/boardRepository'
import { memoryFileRepository } from '@/server/adapters/memory/fileRepository'
import { memoryFileStorage } from '@/server/adapters/memory/fileStorage'

const subject = (role: Role): Subject => ({
  uid: UserUid.parse(`${role}-1`),
  roles: [role],
  companies: new Map(),
  applicant: null,
})
const admin = subject('admin')
const now = Instant.parse('2026-10-25T10:00:00.000Z')

/** Stands in for sharp: anything starting with "IMG" is a picture */
const images: ImageProcessor = {
  fit: (bytes, size) =>
    Promise.resolve(
      new TextDecoder().decode(bytes).startsWith('IMG')
        ? {
            bytes: new TextEncoder().encode(
              `WEBP ${size.width}x${size.height}`,
            ),
            contentType: 'image/webp',
          }
        : null,
    ),
  trim: () => Promise.resolve(null),
}

const setup = () => ({
  board: memoryBoardRepository(),
  files: memoryFileRepository(),
  storage: memoryFileStorage(),
  images,
  now: () => Instant.parse('2026-10-25T10:00:00.000Z'),
})

const input = (name: string, featured = false): BoardMemberInput => ({
  name,
  title: { nb: 'Leder', en: 'Manager' },
  email: EmailAddress.parse(`${name.toLowerCase()}@et-dagen.no`),
  phone: null,
  featured,
})

const names = async (deps: ReturnType<typeof setup>) =>
  (await listBoard(deps)).map((member) => `${member.order}:${member.name}`)

describe('board members', () => {
  it('adds members last and moves one, keeping the others in order', async () => {
    const deps = setup()
    for (const name of ['Ada', 'Bo', 'Cy']) {
      await addMember(deps, { subject: admin, now, input: input(name) })
    }
    const cy = (await listBoard(deps))[2]!

    await moveMember(deps, { subject: admin, now, id: cy.id, to: 0 })
    expect(await names(deps)).toEqual(['0:Cy', '1:Ada', '2:Bo'])

    await moveMember(deps, { subject: admin, now, id: cy.id, to: 99 })
    expect(await names(deps)).toEqual(['0:Ada', '1:Bo', '2:Cy'])
  })

  it('keeps one featured member', async () => {
    const deps = setup()
    const ada = await addMember(deps, {
      subject: admin,
      now,
      input: input('Ada', true),
    })
    const bo = await addMember(deps, {
      subject: admin,
      now,
      input: input('Bo'),
    })

    await updateMember(deps, {
      subject: admin,
      now,
      id: bo.id,
      input: input('Bo', true),
    })
    const featured = (await listBoard(deps)).filter((m) => m.featured)
    expect(featured.map((m) => m.id)).toEqual([bo.id])
    expect(featured[0]!.id).not.toBe(ada.id)
  })

  it('stores the fitted portrait and replaces the old one', async () => {
    const deps = setup()
    const ada = await addMember(deps, {
      subject: admin,
      now,
      input: input('Ada'),
    })
    const photo = {
      subject: admin,
      now,
      id: ada.id,
      name: 'ada.jpg',
      contentType: 'image/jpeg',
      bytes: new TextEncoder().encode('IMG jpeg'),
    }

    const first = await setPortrait(deps, photo)
    const second = await setPortrait(deps, photo)

    expect(second.photoUrl).toMatch(/^memory:\/\/fair\/portraits\/.+\.webp$/)
    expect([...deps.storage.files.keys()]).toEqual([
      second.photoUrl!.replace('memory://', ''),
    ])
    expect(first.photoUrl).not.toBe(second.photoUrl)
    expect(
      new TextDecoder().decode([...deps.storage.files.values()][0]!.bytes),
    ).toBe('WEBP 800x960')
  })

  it('refuses portraits it cannot use', async () => {
    const deps = setup()
    const ada = await addMember(deps, {
      subject: admin,
      now,
      input: input('Ada'),
    })
    const photo = (contentType: string, text: string) => ({
      subject: admin,
      now,
      id: ada.id,
      name: 'x',
      contentType,
      bytes: new TextEncoder().encode(text),
    })

    await expect(
      setPortrait(deps, photo('application/pdf', 'IMG')),
    ).rejects.toMatchObject({
      code: 'file/unsupported-type',
    })
    await expect(
      setPortrait(deps, photo('image/png', 'not a picture')),
    ).rejects.toMatchObject({
      code: 'board/unreadable-image',
    })
    expect(deps.storage.files.size).toBe(0)
  })

  it('removes a member with their portrait and closes the gap', async () => {
    const deps = setup()
    const ada = await addMember(deps, {
      subject: admin,
      now,
      input: input('Ada'),
    })
    await addMember(deps, { subject: admin, now, input: input('Bo') })
    await setPortrait(deps, {
      subject: admin,
      now,
      id: ada.id,
      name: 'ada.png',
      contentType: 'image/png',
      bytes: new TextEncoder().encode('IMG'),
    })

    await removeMember(deps, { subject: admin, now, id: ada.id })
    expect(await names(deps)).toEqual(['0:Bo'])
    expect(deps.storage.files.size).toBe(0)
  })

  it('lets only admins change the board, and names a missing member', async () => {
    const deps = setup()
    for (const role of ['user', 'company', 'coordinator'] as const) {
      await expect(
        addMember(deps, { subject: subject(role), now, input: input('Ada') }),
      ).rejects.toMatchObject({ code: 'auth/forbidden' })
    }
    await expect(
      addMember(deps, { subject: undefined, now, input: input('Ada') }),
    ).rejects.toMatchObject({ code: 'auth/signed-out' })
    await expect(
      removeMember(deps, { subject: admin, now, id: BoardMemberId.random() }),
    ).rejects.toMatchObject({ code: 'board/not-found' })
  })
})
