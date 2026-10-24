import type { FileRepository } from '@/application/files/fileRepository'
import type { FileStorage } from '@/application/files/fileStorage'
import { fail } from '@/domain/errors'
import {
  FILE_RULES,
  FileId,
  storagePathOf,
  uploadProblem,
  type FileKind,
  type FileOwner,
  type StoredFile,
} from '@/domain/files/file'
import type { ISO8601String } from '@/domain/time'
import type { UserUid } from '@/domain/user'

export interface FileDependencies {
  files: FileRepository
  storage: FileStorage
  now: () => ISO8601String
}

export interface Upload {
  kind: FileKind
  owner: FileOwner
  uploader: UserUid | null
  name: string
  contentType: string
  bytes: Uint8Array
}

const ownerTag = (owner: FileOwner) =>
  owner.kind === 'fair' ? 'fair' : `${owner.kind}:${owner.uid}`

/**
 * Store a file at the place its owner and kind decide, and record it
 *
 * @remarks
 * Does not decide who may upload for whom; the caller has checked that. For a kind an owner has
 * one of (a résumé, a logo), the older file is removed once the new one is recorded, so a failed
 * upload never leaves the owner with none.
 *
 * @throws AppError `file/unsupported-type`, `file/too-large`, `file/empty` or `file/wrong-owner`
 */
export async function uploadFile(
  upload: Upload,
  { files, storage, now }: FileDependencies,
): Promise<StoredFile> {
  const problem = uploadProblem(
    upload.kind,
    upload.owner,
    upload.contentType,
    upload.bytes.byteLength,
  )
  if (problem) throw fail(`file/${problem.kind}`)

  const file: StoredFile = {
    id: FileId.random(),
    owner: upload.owner,
    kind: upload.kind,
    uploader: upload.uploader,
    name: upload.name,
    contentType: upload.contentType,
    size: upload.bytes.byteLength,
    createdAt: now(),
  }
  const path = storagePathOf(file)
  await storage.put(path, upload.bytes, {
    contentType: upload.contentType,
    public: FILE_RULES[upload.kind].public,
    metadata: {
      fileId: file.id,
      owner: ownerTag(file.owner),
      ...(file.uploader && { uploader: file.uploader }),
    },
  })
  try {
    await files.save(file)
  } catch (error) {
    await storage.remove(path).catch(() => {})
    throw error
  }

  if (FILE_RULES[upload.kind].single) {
    const older = (await files.ofOwner(upload.owner, upload.kind)).filter(
      (other) => other.id !== file.id,
    )
    for (const other of older) await removeFile(other, { files, storage })
  }
  return file
}

/** Remove a file's contents and its record */
export async function removeFile(
  file: StoredFile,
  { files, storage }: Pick<FileDependencies, 'files' | 'storage'>,
): Promise<void> {
  await storage.remove(storagePathOf(file))
  await files.remove(file.id)
}

/**
 * Remove everything an owner has stored, for erasing a person or a company
 *
 * @returns how many files were removed
 */
export async function eraseOwnerFiles(
  owner: FileOwner,
  deps: Pick<FileDependencies, 'files' | 'storage'>,
): Promise<number> {
  const owned = await deps.files.ofOwner(owner)
  for (const file of owned) await removeFile(file, deps)
  return owned.length
}
