import type { BoardRepository } from '@/application/board/boardRepository'
import type { ImageProcessor } from '@/application/files/imageProcessor'
import {
  removeFile,
  uploadFile,
  type FileDependencies,
} from '@/application/files/uploadFile'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import {
  BoardMemberId,
  PORTRAIT,
  type BoardMember,
  type BoardMemberInput,
} from '@/domain/board/member'
import { fail } from '@/domain/errors'
import { storagePathOf } from '@/domain/files/file'
import type { ISO8601String } from '@/domain/time'

export interface BoardDependencies extends FileDependencies {
  board: BoardRepository
  images: ImageProcessor
}

/** A member as the contact page and the admin show them */
export type ShownMember = Omit<BoardMember, 'photo'> & {
  photoUrl: string | null
}

type Reading = Pick<BoardDependencies, 'board' | 'files' | 'storage'>

async function shown(
  member: BoardMember,
  { files, storage }: Pick<BoardDependencies, 'files' | 'storage'>,
): Promise<ShownMember> {
  const { photo, ...rest } = member
  const file = photo && (await files.find(photo))
  return {
    ...rest,
    photoUrl: file ? storage.publicUrl(storagePathOf(file)) : null,
  }
}

/** The board in its order on the contact page */
export async function listBoard(deps: Reading): Promise<ShownMember[]> {
  const members = await deps.board.all()
  return Promise.all(members.map((member) => shown(member, deps)))
}

async function existing(deps: Reading, id: BoardMemberId) {
  const member = await deps.board.find(id)
  if (!member) throw fail('board/not-found')
  return member
}

/** The featured member loses the flag when another one takes it */
const unfeatured = (members: readonly BoardMember[], keep: BoardMemberId) =>
  members
    .filter((member) => member.featured && member.id !== keep)
    .map((member) => ({ ...member, featured: false }))

/**
 * Add a member at the end of the board
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`
 */
export async function addMember(
  deps: Reading,
  request: {
    subject: Subject | undefined
    now: ISO8601String
    input: BoardMemberInput
  },
): Promise<ShownMember> {
  authorize(request.subject, 'board', 'manage', undefined, { now: request.now })
  const members = await deps.board.all()
  const member: BoardMember = {
    id: BoardMemberId.random(),
    ...request.input,
    photo: null,
    order: members.length,
  }
  await deps.board.save([
    member,
    ...(member.featured ? unfeatured(members, member.id) : []),
  ])
  return shown(member, deps)
}

/**
 * Change a member's details
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `board/not-found`
 */
export async function updateMember(
  deps: Reading,
  request: {
    subject: Subject | undefined
    now: ISO8601String
    id: BoardMemberId
    input: BoardMemberInput
  },
): Promise<ShownMember> {
  authorize(request.subject, 'board', 'manage', undefined, { now: request.now })
  const member = { ...(await existing(deps, request.id)), ...request.input }
  await deps.board.save([
    member,
    ...(member.featured ? unfeatured(await deps.board.all(), member.id) : []),
  ])
  return shown(member, deps)
}

/**
 * Remove a member and their portrait, closing the gap in the order
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `board/not-found`
 */
export async function removeMember(
  deps: Reading,
  request: {
    subject: Subject | undefined
    now: ISO8601String
    id: BoardMemberId
  },
): Promise<void> {
  authorize(request.subject, 'board', 'manage', undefined, { now: request.now })
  const member = await existing(deps, request.id)
  await deps.board.remove(member.id)
  await deps.board.save(
    (await deps.board.all()).map((other, order) => ({ ...other, order })),
  )
  const photo = member.photo && (await deps.files.find(member.photo))
  if (photo) await removeFile(photo, deps)
}

/**
 * Move a member to a place on the board; the others keep their order around them
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `board/not-found`
 */
export async function moveMember(
  deps: Reading,
  request: {
    subject: Subject | undefined
    now: ISO8601String
    id: BoardMemberId
    to: number
  },
): Promise<void> {
  authorize(request.subject, 'board', 'manage', undefined, { now: request.now })
  const member = await existing(deps, request.id)
  const others = (await deps.board.all()).filter((m) => m.id !== member.id)
  const to = Math.max(0, Math.min(others.length, Math.trunc(request.to)))
  others.splice(to, 0, member)
  await deps.board.save(others.map((other, order) => ({ ...other, order })))
}

/**
 * Give a member a new portrait, cropped and scaled to {@link PORTRAIT}
 *
 * @remarks
 * The old portrait is removed only once the member points at the new one.
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `board/not-found`, `file/unsupported-type`,
 * `file/too-large`, `file/empty` or `board/unreadable-image`
 */
export async function setPortrait(
  deps: BoardDependencies,
  request: {
    subject: Subject | undefined
    now: ISO8601String
    id: BoardMemberId
    name: string
    contentType: string
    bytes: Uint8Array
  },
): Promise<ShownMember> {
  authorize(request.subject, 'board', 'manage', undefined, { now: request.now })
  const member = await existing(deps, request.id)

  if (!(PORTRAIT.types as readonly string[]).includes(request.contentType)) {
    throw fail('file/unsupported-type')
  }
  if (request.bytes.byteLength === 0) throw fail('file/empty')
  if (request.bytes.byteLength > PORTRAIT.maxBytes) throw fail('file/too-large')

  const fitted = await deps.images.fit(request.bytes, PORTRAIT)
  if (!fitted) throw fail('board/unreadable-image')

  const file = await uploadFile(
    {
      kind: 'portrait',
      owner: { kind: 'fair' },
      uploader: request.subject.uid,
      name: request.name,
      contentType: fitted.contentType,
      bytes: fitted.bytes,
    },
    deps,
  )
  const updated = { ...member, photo: file.id }
  await deps.board.save([updated])
  const old = member.photo && (await deps.files.find(member.photo))
  if (old) await removeFile(old, deps)
  return shown(updated, deps)
}
