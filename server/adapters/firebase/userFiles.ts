import type { UserFiles } from '@/application/users/userFiles'

/** The part of a Storage bucket the adapter uses */
export interface Bucket {
  deleteFiles(options: { prefix: string }): Promise<unknown>
}

/** Files under `users/<uid>/` in Cloud Storage */
export const storageUserFiles = (bucket: Bucket): UserFiles => ({
  remove: async (users) => {
    await Promise.all(
      users.map((uid) => bucket.deleteFiles({ prefix: `users/${uid}/` })),
    )
  },
})
