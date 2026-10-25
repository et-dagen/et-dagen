import type { getStorage } from 'firebase-admin/storage'
import type { FileStorage } from '@/application/files/fileStorage'

type Bucket = ReturnType<ReturnType<typeof getStorage>['bucket']>

/**
 * File contents in a Cloud Storage bucket
 *
 * @remarks
 * A public file is readable by anyone at its `storage.googleapis.com` address, as logos are today;
 * a private one only through a signed link, which needs the service account's key.
 */
export function firebaseFileStorage(bucket: Bucket): FileStorage {
  return {
    put: async (path, bytes, options) => {
      await bucket.file(path).save(Buffer.from(bytes), {
        resumable: false,
        contentType: options.contentType,
        public: options.public,
        metadata: { metadata: options.metadata },
      })
    },
    exists: async (path) => (await bucket.file(path).exists())[0],
    remove: async (path) => {
      await bucket.file(path).delete({ ignoreNotFound: true })
    },
    temporaryUrl: async (path, seconds) => {
      const [url] = await bucket.file(path).getSignedUrl({
        action: 'read',
        expires: Date.now() + seconds * 1000,
      })
      return url
    },
    publicUrl: (path) =>
      `https://storage.googleapis.com/${bucket.name}/${path}`,
  }
}
