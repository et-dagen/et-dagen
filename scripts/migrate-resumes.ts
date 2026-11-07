/**
 * Store the résumés uploaded before files had records as recorded files
 *
 * v1 stored a résumé as an object under `users/<uid>/` and put its link in `users/<uid>/resume`.
 * This stores each one as the user's résumé file, as an upload does today, points the profile at
 * the file id and deletes the old object. Profiles that already point at a file id are left alone,
 * so the script can run again. Links that do not point into the user's own folder, missing
 * objects and files that are not PDFs are listed and left as they are.
 *
 *   bun --env-file=.env scripts/migrate-resumes.ts           # dry run: list what would move
 *   bun --env-file=.env scripts/migrate-resumes.ts --apply   # move it
 *
 * Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs against the emulators when
 * FIREBASE_DATABASE_EMULATOR_HOST is set.
 */
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import { uploadFile } from '@/application/files/uploadFile'
import { FILE_RULES, FileId } from '@/domain/files/file'
import { Instant } from '@/domain/time'
import { UserUid } from '@/domain/user'
import { firebaseFileStorage } from '@/server/adapters/firebase/fileStorage'
import { rtdbFileRepository } from '@/server/adapters/rtdb/fileRepository'
import { rtdbResumeIndex } from '@/server/adapters/rtdb/resumeIndex'

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

const db = getDatabase(app)
const bucket = getStorage(app).bucket()
const files = rtdbFileRepository(db)
const storage = firebaseFileStorage(bucket)
const resumes = rtdbResumeIndex(db)

const isFileId = (reference: string) => {
  try {
    FileId.parse(reference)
    return true
  } catch {
    return false
  }
}

/** The object a v1 link points at, when it is in the user's own folder, as v1 stored it */
const pathOf = (uid: string, link: string): string | null => {
  const prefix = storage.publicUrl('')
  if (!link.startsWith(prefix)) return null
  const path = decodeURIComponent(link.slice(prefix.length))
  return path.startsWith(`users/${uid}/`) && !path.includes('..') ? path : null
}

const counts = { moved: 0, recorded: 0, skipped: 0 }
const skip = (uid: string, why: string) => {
  console.log(`skipping ${uid}: ${why}`)
  counts.skipped++
}

for (const holder of await resumes.holders()) {
  const uid = holder.uid
  const reference = (await resumes.of(uid))!
  if (isFileId(reference)) {
    counts.recorded++
    continue
  }

  const path = pathOf(uid, reference)
  if (!path) {
    skip(uid, 'the link does not point into the user’s folder')
    continue
  }
  const object = bucket.file(path)
  const [exists] = await object.exists()
  if (!exists) {
    skip(uid, `${path} does not exist`)
    continue
  }
  const [metadata] = await object.getMetadata()
  const contentType = String(metadata.contentType ?? '')
  const size = Number(metadata.size ?? 0)
  if (!(FILE_RULES.resume.types as readonly string[]).includes(contentType)) {
    skip(uid, `${path} is ${contentType || 'of no known type'}, not a PDF`)
    continue
  }
  if (size === 0 || size > FILE_RULES.resume.maxBytes) {
    skip(uid, `${path} is ${size} bytes`)
    continue
  }

  console.log(
    `${apply ? 'moving' : 'would move'}: ${path} (${size} bytes) for ${uid}`,
  )
  if (apply) {
    const [bytes] = await object.download()
    const stored = await uploadFile(
      {
        kind: 'resume',
        owner: { kind: 'user', uid: UserUid.parse(uid) },
        uploader: UserUid.parse(uid),
        name: path.slice(path.lastIndexOf('/') + 1),
        contentType,
        bytes: new Uint8Array(bytes),
      },
      { files, storage, now: Instant.now },
    )
    await resumes.set(uid, stored.id)
    await object.delete()
  }
  counts.moved++
}

console.log(
  `${counts.moved} résumés ${apply ? 'moved' : 'to move'}, ${counts.recorded} already recorded, ` +
    `${counts.skipped} skipped.${apply ? '' : ' Run again with --apply to move them.'}`,
)
process.exit(0)
