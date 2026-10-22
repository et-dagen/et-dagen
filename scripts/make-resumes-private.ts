/**
 * Make every stored resume private, so links that were handed out before stop working
 *
 * Uploads used to be public objects. Run this once against production after the release that
 * serves resumes through GET /api/v1/resume/file. It only touches `users/` (resumes), never
 * `companies/` (logos, which stay public).
 *
 *   bun --env-file=.env scripts/make-resumes-private.ts           # dry run: list what would change
 *   bun --env-file=.env scripts/make-resumes-private.ts --apply   # make them private
 *
 * Reads the same NUXT_FIREBASE_ADMIN_* variables as the server.
 */
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const apply = process.argv.includes('--apply')

const app = initializeApp({
  credential: cert({
    projectId: env('NUXT_FIREBASE_ADMIN_PROJECT_ID'),
    clientEmail: env('NUXT_FIREBASE_ADMIN_CLIENT_EMAIL'),
    privateKey: env('NUXT_FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n'),
  } as ServiceAccount),
  storageBucket: env('NUXT_FIREBASE_ADMIN_STORAGE_BUCKET'),
})
const bucket = getStorage(app).bucket()

// Making objects private does nothing if the whole bucket is readable by everyone
const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 })
const publicRoles = policy.bindings
  .filter((binding) => binding.members.includes('allUsers'))
  .map((binding) => binding.role)
if (publicRoles.length > 0) {
  console.error(
    `The bucket itself grants allUsers ${publicRoles.join(', ')}. ` +
      'Every object is public regardless of its own setting; fix the bucket policy first.',
  )
  process.exit(1)
}

const [files] = await bucket.getFiles({ prefix: 'users/' })
let changed = 0
for (const file of files) {
  const [isPublic] = await file.isPublic()
  if (!isPublic) continue
  changed++
  console.log(`${apply ? 'private' : 'would make private'}: ${file.name}`)
  if (apply) await file.makePrivate()
}

const hint =
  apply || changed === 0 ? '' : ' Run again with --apply to change them.'
console.log(
  `${files.length} resume files, ${changed} ${apply ? 'made private' : 'public'}.${hint}`,
)
