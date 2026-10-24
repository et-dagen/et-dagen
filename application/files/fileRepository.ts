import type {
  FileId,
  FileKind,
  FileOwner,
  StoredFile,
} from '@/domain/files/file'
import type { UserUid } from '@/domain/user'

/** The records of stored files, which say who owns each one */
export interface FileRepository {
  save(file: StoredFile): Promise<void>

  /** null when no file has this id */
  find(id: FileId): Promise<StoredFile | null>

  /** An owner's files, of one kind when given, newest first */
  ofOwner(owner: FileOwner, kind?: FileKind): Promise<StoredFile[]>

  /** Removing a record that does not exist is not an error */
  remove(id: FileId): Promise<void>

  /** Forget who uploaded files, for an erased person; returns how many records changed */
  clearUploader(user: UserUid): Promise<number>
}
