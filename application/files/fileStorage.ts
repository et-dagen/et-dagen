/**
 * Where file contents live: a bucket today, a server's disk later
 *
 * @remarks
 * Knows bytes and paths only. Who owns a file and what kind it is live in the
 * {@link FileRepository} record, so moving storage needs only a new adapter.
 */
export interface FileStorage {
  /** Store bytes at a path, replacing anything there; a public file gets a lasting link */
  put(
    path: string,
    bytes: Uint8Array,
    options: {
      contentType: string
      public: boolean
      metadata: Readonly<Record<string, string>>
    },
  ): Promise<void>

  /** Whether anything is stored at a path */
  exists(path: string): Promise<boolean>

  /** Remove the file at a path; a path with nothing there is not an error */
  remove(path: string): Promise<void>

  /** A link that opens a private file for a while */
  temporaryUrl(path: string, seconds: number): Promise<string>

  /** The lasting link of a file anyone may see, such as a logo */
  publicUrl(path: string): string
}
