/**
 * Move the stand maps stored the old way into the fair's files
 *
 * Before the admin upload, a stand map was a file in the bucket named by its day,
 * `standmaps/<YYYY-MM-DD>.<ext>`. This stores each one as a fair file, as an upload in the admin
 * does, records it for its day, and deletes the old file. A day that already has an uploaded map
 * keeps it, and its old file is deleted. Run it once against production before releasing the API
 * that no longer lists the old files.
 *
 *   bun --env-file=.env scripts/migrate-standmaps.ts           # dry run: list what would move
 *   bun --env-file=.env scripts/migrate-standmaps.ts --apply   # move it
 *
 * Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs against the emulators when
 * FIREBASE_DATABASE_EMULATOR_HOST is set.
 */
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import { uploadFile } from '@/application/files/uploadFile'
import { FairDay } from '@/domain/fair/day'
import { Instant } from '@/domain/time'
import { firebaseFileStorage } from '@/server/adapters/firebase/fileStorage'
import { rtdbFileRepository } from '@/server/adapters/rtdb/fileRepository'
import { rtdbStandMapIndex } from '@/server/adapters/rtdb/standMapIndex'

const PREFIX = 'standmaps/'

const apply = process.argv.includes('--apply')

const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const emulated = Boolean(process.env.FIREBASE_DATABASE_EMULATOR_HOST)
const app = initializeApp({
  ...(emulated
    ? { projectId: env('NUXT_FIREBASE_ADMIN_PROJECT_ID') }
    : {
        credential: cert({
          projectId: env('NUXT_FIREBASE_ADMIN_PROJECT_ID'),
          clientEmail: env('NUXT_FIREBASE_ADMIN_CLIENT_EMAIL'),
          privateKey: env('NUXT_FIREBASE_ADMIN_PRIVATE_KEY').replace(
            /\\n/g,
            '\n',
          ),
        } as ServiceAccount),
      }),
  storageBucket: env('NUXT_FIREBASE_ADMIN_STORAGE_BUCKET'),
  databaseURL: env('NUXT_PUBLIC_FIREBASE_DATABASE_URL'),
})

const bucket = getStorage(app).bucket()
const files = rtdbFileRepository(getDatabase(app))
const storage = firebaseFileStorage(bucket)
const standMaps = rtdbStandMapIndex(getDatabase(app))

const recorded = await standMaps.all()
const [old] = await bucket.getFiles({ prefix: PREFIX, delimiter: '/' })

let moved = 0
for (const file of old) {
  const name = file.name.slice(PREFIX.length)
  // the folder's own placeholder, which the console leaves behind
  if (!name) {
    console.log(`${apply ? 'deleting' : 'would delete'}: ${file.name}`)
    if (apply) await file.delete()
    continue
  }
  const day = FairDay.tryParse(name.split('.')[0]!)
  if (!day) {
    console.log(`skipping ${file.name}: not named by a day`)
    continue
  }
  if (recorded.has(day)) {
    console.log(
      `${apply ? 'deleting' : 'would delete'}: ${file.name}, ${day} has an uploaded map`,
    )
    if (apply) await file.delete()
    continue
  }

  const contentType = String(file.metadata.contentType ?? '')
  const size = `${contentType}, ${file.metadata.size} bytes`
  console.log(
    `${apply ? 'moving' : 'would move'}: ${file.name} (${size}) to ${day}`,
  )
  if (apply) {
    const [bytes] = await file.download()
    const stored = await uploadFile(
      {
        kind: 'standmap',
        owner: { kind: 'fair' },
        uploader: null,
        name,
        contentType,
        bytes: new Uint8Array(bytes),
      },
      { files, storage, now: Instant.now },
    )
    await standMaps.set(day, stored.id)
    await file.delete()
  }
  moved++
}

console.log(
  `${moved} stand maps ${apply ? 'moved' : 'to move'}.${
    apply ? '' : ' Run again with --apply to move them.'
  }`,
)
process.exit(0)
