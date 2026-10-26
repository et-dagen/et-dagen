/**
 * Store roles, company memberships and affiliations from the v1 fields (#640)
 *
 * Writes `roles/`, `memberships/` and `affiliations/` from each user's `userType` and `companyUID`
 * and each company's `type` and `cvAccess`, so every user keeps the access they have. It leaves the
 * v1 fields as they are and skips anyone already migrated, so it is safe to run again.
 *
 *   bun --env-file=.env.development scripts/migrate-entitlements.ts           # dry run
 *   bun --env-file=.env.development scripts/migrate-entitlements.ts --apply   # write it
 *
 * Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs against the emulators when
 * FIREBASE_DATABASE_EMULATOR_HOST is set.
 *
 * Do not run it against dev or production before the endpoints and the admin panel write these nodes
 * too (#640, step 2). A migrated user or company is read only from them, so a change an admin made
 * to the v1 fields alone would silently stop counting.
 */
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { Instant } from '@/domain/time'
import { v1AccessUpdate } from '@/server/adapters/rtdb/v1Access'

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

const read = async (path: string) =>
  ((await db.ref(path).once('value')).val() ?? {}) as Record<string, never>

const update = v1AccessUpdate(
  {
    users: await read('users'),
    companies: await read('companies'),
    roles: await read('roles'),
    affiliations: await read('affiliations'),
  },
  Instant.now(),
)

const count = (node: string) =>
  new Set(
    Object.keys(update)
      .filter((path) => path.startsWith(`${node}/`))
      .map((path) => path.split('/')[1]),
  ).size
for (const [path, value] of Object.entries(update)) {
  console.log(
    `${apply ? 'write' : 'would write'} ${path}`,
    JSON.stringify(value),
  )
}
console.log(
  `${count('roles')} users get roles, ${count('memberships')} get memberships, ` +
    `${count('affiliations')} companies get affiliations.${
      apply || Object.keys(update).length === 0
        ? ''
        : ' Run again with --apply to write them.'
    }`,
)

if (apply && Object.keys(update).length > 0) await db.ref().update(update)
process.exit(0)
