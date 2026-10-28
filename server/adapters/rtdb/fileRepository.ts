import type { Database } from 'firebase-admin/database'
import type { FileRepository } from '@/application/files/fileRepository'
import { CompanyUid } from '@/domain/business/company'
import {
  FileId,
  type FileKind,
  type FileOwner,
  type StoredFile,
} from '@/domain/files/file'
import { Instant } from '@/domain/time/instant'
import { UserUid } from '@/domain/user'

/** `files/<id>` as stored; `ownerKey` makes "an owner's files" one indexed query */
interface FileRecord {
  ownerKey: string
  kind: FileKind
  uploader: string | null
  name: string
  contentType: string
  size: number
  createdAt: string
}

const ownerKeyOf = (owner: FileOwner) =>
  owner.kind === 'fair' ? 'fair' : `${owner.kind}:${owner.uid}`

function ownerOf(key: string): FileOwner {
  const [kind, uid] = key.split(':') as [string, string | undefined]
  if (kind === 'user') return { kind, uid: UserUid.parse(uid ?? '') }
  if (kind === 'company') return { kind, uid: CompanyUid.parse(uid ?? '') }
  return { kind: 'fair' }
}

const toRecord = (file: StoredFile): FileRecord => ({
  ownerKey: ownerKeyOf(file.owner),
  kind: file.kind,
  uploader: file.uploader,
  name: file.name,
  contentType: file.contentType,
  size: file.size,
  createdAt: file.createdAt,
})

const toFile = (id: string, record: FileRecord): StoredFile => ({
  id: FileId.parse(id),
  owner: ownerOf(record.ownerKey),
  kind: record.kind,
  uploader: record.uploader ? UserUid.parse(record.uploader) : null,
  name: record.name,
  contentType: record.contentType,
  size: record.size,
  createdAt: Instant.parse(record.createdAt as never),
})

const filesOf = (value: Record<string, FileRecord> | null) =>
  Object.entries(value ?? {}).map(([id, record]) => toFile(id, record))

/**
 * File records in the Realtime Database under `files/`
 *
 * @remarks
 * Production rules should index `files` on `ownerKey` and `uploader`, or the database filters
 * on the server's side of the connection instead of its own.
 */
export function rtdbFileRepository(db: Database): FileRepository {
  // a reference per call: building the adapter must not open a connection
  const files = () => db.ref('files')

  return {
    save: async (file) => {
      await files().child(file.id).set(toRecord(file))
    },
    find: async (id) => {
      const record = (
        await files().child(id).once('value')
      ).val() as FileRecord | null
      return record ? toFile(id, record) : null
    },
    ofOwner: async (owner, kind) => {
      const snapshot = await files()
        .orderByChild('ownerKey')
        .equalTo(ownerKeyOf(owner))
        .once('value')
      return filesOf(snapshot.val())
        .filter((file) => !kind || file.kind === kind)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    remove: async (id) => {
      await files().child(id).remove()
    },
    clearUploader: async (user) => {
      const snapshot = await files()
        .orderByChild('uploader')
        .equalTo(user)
        .once('value')
      const ids = Object.keys(snapshot.val() ?? {})
      if (ids.length > 0) {
        await files().update(
          Object.fromEntries(ids.map((id) => [`${id}/uploader`, null])),
        )
      }
      return ids.length
    },
  }
}
