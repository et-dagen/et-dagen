import type { FileRepository } from '@/application/files/fileRepository'
import { sameOwner, type FileId, type StoredFile } from '@/domain/files/file'

/** File records held in a map, for tests and local work */
export function memoryFileRepository(
  seed: readonly StoredFile[] = [],
): FileRepository {
  const files = new Map<FileId, StoredFile>(seed.map((f) => [f.id, f]))

  return {
    save: (file) => {
      files.set(file.id, file)
      return Promise.resolve()
    },
    find: (id) => Promise.resolve(files.get(id) ?? null),
    ofOwner: (owner, kind) =>
      Promise.resolve(
        [...files.values()]
          .filter(
            (f) => sameOwner(f.owner, owner) && (!kind || f.kind === kind),
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),
    remove: (id) => {
      files.delete(id)
      return Promise.resolve()
    },
    clearUploader: (user) => {
      let changed = 0
      for (const [id, file] of files) {
        if (file.uploader === user) {
          files.set(id, { ...file, uploader: null })
          changed++
        }
      }
      return Promise.resolve(changed)
    },
  }
}
