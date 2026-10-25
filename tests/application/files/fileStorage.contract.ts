/**
 * What every {@link FileStorage} adapter must do with bytes and paths
 *
 * Links are left out: a signed link needs a real service account, which the emulator lacks.
 */
import { describe, expect, it } from 'vitest'
import type { FileStorage } from '@/application/files/fileStorage'

const bytes = new Uint8Array([37, 80, 68, 70, 45])

export function describeFileStorage(
  adapter: string,
  make: () => Promise<FileStorage> | FileStorage,
) {
  describe(`${adapter} FileStorage`, () => {
    it('stores, finds and removes a file', async () => {
      const storage = await make()
      const path = `users/ada/resumes/${crypto.randomUUID()}.pdf`
      await storage.put(path, bytes, {
        contentType: 'application/pdf',
        public: false,
        metadata: { owner: 'user:ada' },
      })
      expect(await storage.exists(path)).toBe(true)

      await storage.remove(path)
      expect(await storage.exists(path)).toBe(false)
    })

    it('removes a missing file without complaint', async () => {
      const storage = await make()
      await expect(
        storage.remove('users/nobody/resumes/none.pdf'),
      ).resolves.toBeUndefined()
    })

    it('gives a public file a lasting address that ends with its path', async () => {
      const storage = await make()
      expect(storage.publicUrl('companies/polarbit/logos/x.png')).toMatch(
        /companies\/polarbit\/logos\/x\.png$/,
      )
    })
  })
}
