/**
 * Remove the stored fields nothing reads since #640
 *
 * Roles, memberships and affiliations decide access now, so a user's `userType`, `companyUID`
 * and `accessLevel`, and a company's `type`, `cvAccess`, `cv_access`, `companyType` and stray
 * `uid`, are dead. So is the `companies-test` node some databases still have. Dry run unless
 * `--apply` is passed; take a backup of `users` and `companies` first.
 *
 *   bun --env-file=.env.development scripts/drop-v1-fields.ts
 *   bun --env-file=.env.development scripts/drop-v1-fields.ts --apply
 *
 * Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs against the emulators when
 * FIREBASE_DATABASE_EMULATOR_HOST is set.
 */
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'

const DEAD: Record<string, readonly string[]> = {
  users: ['userType', 'companyUID', 'accessLevel'],
  companies: ['type', 'cvAccess', 'cv_access', 'companyType', 'uid'],
}
const DEAD_NODES = ['companies-test']

const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const apply = process.argv.includes('--apply')
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
  databaseURL: env('NUXT_PUBLIC_FIREBASE_DATABASE_URL'),
})
const db = getDatabase(app)

const update: Record<string, null> = {}
for (const [node, fields] of Object.entries(DEAD)) {
  const records = ((await db.ref(node).once('value')).val() ?? {}) as Record<
    string,
    Record<string, unknown>
  >
  for (const [uid, record] of Object.entries(records)) {
    for (const field of fields) {
      if (record && field in record) update[`${node}/${uid}/${field}`] = null
    }
  }
}
for (const node of DEAD_NODES) {
  if ((await db.ref(node).once('value')).exists()) update[node] = null
}

const counts: Record<string, number> = {}
for (const path of Object.keys(update)) {
  const parts = path.split('/')
  const key = parts.length === 1 ? parts[0]! : `${parts[0]}.${parts[2]}`
  counts[key] = (counts[key] ?? 0) + 1
}
console.log(
  Object.entries(counts)
    .map(
      ([key, count]) => `${apply ? 'remove' : 'would remove'} ${key}: ${count}`,
    )
    .join('\n') || 'Nothing to remove.',
)
if (apply && Object.keys(update).length > 0) await db.ref().update(update)
if (!apply && Object.keys(update).length > 0)
  console.log('Dry run: pass --apply to remove them.')
process.exit(0)
