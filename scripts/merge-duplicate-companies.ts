/**
 * Merge companies stored more than once into the entry that is kept
 *
 * Takes a plan, a JSON file of `[{ keep, remove: [uid, ...], name? }]`, from a run of
 * `find-duplicate-companies.ts` that a person checked. For each removed entry it:
 *
 * - points events, jobs and users at the kept entry;
 * - deletes its registration codes, file records and stored files (logos);
 * - deletes its affiliation and the entry itself.
 *
 * `name` renames the kept entry. Dry run unless `--apply` is passed.
 *
 *   bun --env-file=.env.development scripts/merge-duplicate-companies.ts plan.json
 *   bun --env-file=.env.development scripts/merge-duplicate-companies.ts plan.json --apply
 *
 * Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs against the emulators when
 * FIREBASE_DATABASE_EMULATOR_HOST is set.
 */
import { readFileSync } from 'node:fs'
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'

interface Merge {
  keep: string
  remove: string[]
  name?: string
}

const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const planPath = process.argv[2]
if (!planPath || planPath.startsWith('--')) throw new Error('Pass a plan file')
const plan = JSON.parse(readFileSync(planPath, 'utf8')) as Merge[]
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
  storageBucket: env('NUXT_FIREBASE_ADMIN_STORAGE_BUCKET').replace(
    /^gs:\/\//,
    '',
  ),
})
const db = getDatabase(app)
const bucket = getStorage(app).bucket()

type Stored = Record<string, Record<string, unknown>>
const read = async (path: string) =>
  ((await db.ref(path).once('value')).val() ?? {}) as Stored

const [companies, events, jobs, users, codes, files] = await Promise.all(
  ['companies', 'events', 'jobs', 'users', 'registrationCodes', 'files'].map(
    read,
  ),
)

const update: Record<string, unknown> = {}
const storedFiles: string[] = []

for (const { keep, remove, name } of plan) {
  if (!companies[keep])
    throw new Error(`The kept company ${keep} is not stored`)
  if (remove.includes(keep)) throw new Error(`${keep} is both kept and removed`)
  if (name) update[`companies/${keep}/name`] = name

  for (const uid of remove) {
    if (!companies[uid]) throw new Error(`The company ${uid} is not stored`)
    for (const [node, records] of Object.entries({ events, jobs, users })) {
      for (const [key, record] of Object.entries(records)) {
        if (record?.companyUID === uid)
          update[`${node}/${key}/companyUID`] = keep
      }
    }
    for (const [key, code] of Object.entries(codes)) {
      if (code?.companyUID === uid) update[`registrationCodes/${key}`] = null
    }
    for (const [key, file] of Object.entries(files)) {
      if (file?.ownerKey === `company:${uid}`) update[`files/${key}`] = null
    }
    update[`affiliations/${uid}`] = null
    update[`companies/${uid}`] = null

    const [found] = await bucket.getFiles({ prefix: `companies/${uid}/` })
    storedFiles.push(...found.map((file) => file.name))
  }
}

for (const [path, value] of Object.entries(update)) {
  console.log(
    `${apply ? 'write' : 'would write'} ${path}`,
    JSON.stringify(value),
  )
}
for (const file of storedFiles) {
  console.log(`${apply ? 'delete' : 'would delete'} file ${file}`)
}

if (apply) {
  await db.ref().update(update)
  await Promise.all(storedFiles.map((file) => bucket.file(file).delete()))
}
const removed = plan.reduce((sum, merge) => sum + merge.remove.length, 0)
console.log(
  `${removed} entries merged into ${plan.length}, ${storedFiles.length} stored files.`,
  apply ? '' : 'Dry run: pass --apply to write.',
)
process.exit(0)
