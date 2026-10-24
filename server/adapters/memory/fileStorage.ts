import type { FileStorage } from '@/application/files/fileStorage'

export interface MemoryFile {
  bytes: Uint8Array
  contentType: string
  public: boolean
  metadata: Readonly<Record<string, string>>
}

/** File contents held in a map, for tests; `files` lets a test look inside */
export function memoryFileStorage(): FileStorage & {
  files: ReadonlyMap<string, MemoryFile>
} {
  const files = new Map<string, MemoryFile>()
  return {
    files,
    put: (path, bytes, options) => {
      files.set(path, { bytes, ...options })
      return Promise.resolve()
    },
    exists: (path) => Promise.resolve(files.has(path)),
    remove: (path) => {
      files.delete(path)
      return Promise.resolve()
    },
    temporaryUrl: (path, seconds) =>
      Promise.resolve(`memory://${path}?expires=${seconds}`),
    publicUrl: (path) => `memory://${path}`,
  }
}
