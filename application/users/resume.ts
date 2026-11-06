import {
  removeFile,
  uploadFile,
  type FileDependencies,
} from '@/application/files/uploadFile'
import type { ResumeIndex } from '@/application/users/resumeIndex'
import { authorize } from '@/domain/authorization/authorize'
import type { Subject } from '@/domain/authorization/subject'
import { fail } from '@/domain/errors'
import { FileId, storagePathOf, type StoredFile } from '@/domain/files/file'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

export interface ResumeDependencies extends FileDependencies {
  resumes: ResumeIndex
}

interface ForUser {
  subject: Subject | undefined
  now: ISO8601String
  owner: UserUid
}

/** How long a link to open a résumé works */
const LINK_SECONDS = 5 * 60

const fileIdOf = (reference: string): FileId | null => {
  try {
    return FileId.parse(reference)
  } catch {
    return null
  }
}

/**
 * Where a user's résumé is kept: a recorded file, or an object stored before files had records
 *
 * @remarks
 * An older link counts only when it points into the user's own folder, as v1 stored it.
 */
async function locate(
  deps: ResumeDependencies,
  owner: UserUid,
): Promise<{ file: StoredFile | null; path: string } | null> {
  const reference = await deps.resumes.of(owner)
  if (!reference) return null

  const id = fileIdOf(reference)
  if (id) {
    const file = await deps.files.find(id)
    return file ? { file, path: storagePathOf(file) } : null
  }

  const prefix = deps.storage.publicUrl('')
  const path = reference.startsWith(prefix)
    ? decodeURIComponent(reference.slice(prefix.length))
    : ''
  const own = path.startsWith(`users/${owner}/`) && !path.includes('..')
  return own ? { file: null, path } : null
}

/**
 * A link that opens the user's résumé for a few minutes
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `resume/not-found`
 */
export async function openResume(
  deps: ResumeDependencies,
  { subject, now, owner }: ForUser,
): Promise<string> {
  const scope = subject?.uid === owner ? 'own' : 'all'
  authorize(subject, 'resume', 'read', { ownerUid: owner, scope }, { now })
  const found = await locate(deps, owner)
  if (!found) throw fail('resume/not-found')
  return await deps.storage.temporaryUrl(found.path, LINK_SECONDS)
}

/**
 * Store a résumé as the user's file and make it their résumé, in place of any earlier one
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden`, `file/unsupported-type`, `file/empty` or
 *   `file/too-large`
 */
export async function uploadResume(
  deps: ResumeDependencies,
  request: ForUser & { name: string; contentType: string; bytes: Uint8Array },
): Promise<StoredFile> {
  const { subject, now, owner } = request
  authorize(
    subject,
    'resume',
    'write',
    { ownerUid: owner, scope: 'own' },
    { now },
  )
  const before = await locate(deps, owner)

  // an earlier recorded résumé is removed by uploadFile, as the user has one
  const file = await uploadFile(
    {
      kind: 'resume',
      owner: { kind: 'user', uid: owner },
      uploader: subject.uid,
      name: request.name,
      contentType: request.contentType,
      bytes: request.bytes,
    },
    deps,
  )
  await deps.resumes.set(owner, file.id)
  if (before && !before.file) await deps.storage.remove(before.path)
  return file
}

/**
 * Delete the user's résumé and stop pointing at it
 *
 * @throws AppError `auth/signed-out`, `auth/forbidden` or `resume/not-found`
 */
export async function removeResume(
  deps: ResumeDependencies,
  { subject, now, owner }: ForUser,
): Promise<void> {
  authorize(
    subject,
    'resume',
    'write',
    { ownerUid: owner, scope: 'own' },
    { now },
  )
  const found = await locate(deps, owner)
  if (!found) throw fail('resume/not-found')

  if (found.file) await removeFile(found.file, deps)
  else await deps.storage.remove(found.path)
  await deps.resumes.set(owner, null)
}
