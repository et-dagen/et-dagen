/**
 * Key the study programmes by their NTNU code, and point students and events at the code
 *
 * Before codes, programmes were stored under the keys "0", "1", ..., and students and events stored
 * a programme's name. This looks each programme up in a list of codes by its name and degree,
 * moves it to `studyProgrammes/<code>`, and rewrites `users/<uid>/studyProgram` and each event's
 * `registration/requirements/programmes` from the old key or name to the code. A programme the
 * list does not know keeps its key, and a student or an event whose programme is not found keeps
 * what it has; both are listed. Programmes already keyed by their code are left alone, so the
 * script can run again. Dry run unless `--apply` is passed; `--apply` needs `--backup <file>`,
 * where it first writes everything it is about to change.
 *
 *   bun --env-file=.env scripts/migrate-programme-codes.ts
 *   bun --env-file=.env scripts/migrate-programme-codes.ts --apply --backup <file>
 *
 * The list is `scripts/data/programme-codes.json`, matched against NTNU's study pages
 * (https://www.ntnu.no/studier/<code>); `--codes <file>` reads another one.
 *
 * Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs against the emulators when
 * FIREBASE_DATABASE_EMULATOR_HOST is set.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { ProgrammeCode } from '@/domain/fair/programme'

interface Coded {
  code: string
  name: string
  type: string
}
type StoredProgramme = { name?: string; type?: string } | string | null
type StoredUser = { studyProgram?: unknown } | null
type StoredEvent = {
  registration?: { requirements?: { programmes?: unknown } | null } | null
} | null

const argument = (name: string) => {
  const at = process.argv.indexOf(name)
  return at > 0 ? process.argv[at + 1] : undefined
}
const apply = process.argv.includes('--apply')
const backup = argument('--backup')
if (apply && !backup) throw new Error('--apply needs --backup <file>')
const codesFile = argument('--codes') ?? 'scripts/data/programme-codes.json'

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
  databaseURL: env('NUXT_PUBLIC_FIREBASE_DATABASE_URL'),
})
const db = getDatabase(app)
const read = async <T>(path: string) =>
  ((await db.ref(path).once('value')).val() ?? {}) as Record<string, T>

// some stored names carry zero-width spaces from being pasted in
const clean = (text: string) =>
  text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()

const coded = JSON.parse(readFileSync(codesFile, 'utf8')) as Coded[]
for (const { code } of coded) {
  if (ProgrammeCode.tryParse(code) !== code) {
    throw new Error(`Not a programme code: ${code}`)
  }
}
const codeOf = new Map(
  coded.map((row) => [`${row.type}|${clean(row.name)}`, row.code]),
)

const programmes = await read<StoredProgramme>('studyProgrammes')
const users = await read<StoredUser>('users')
const events = await read<StoredEvent>('events')

const update: Record<string, unknown> = {}
const before: Record<string, unknown> = {}
const change = (path: string, was: unknown, next: unknown) => {
  before[path] = was ?? null
  update[path] = next
}

// what a student or an event may have stored for a programme, and its code
const toCode = new Map<string, string>()
const codes = new Set<string>()
const unknown: string[] = []
for (const [key, record] of Object.entries(programmes)) {
  const fields = typeof record === 'string' ? { name: record } : record
  if (!fields?.name) continue
  const code = codeOf.get(
    `${fields.type ?? 'integrated'}|${clean(fields.name)}`,
  )
  if (!code) {
    unknown.push(`${key}: ${fields.name} (${fields.type ?? 'no type'})`)
    codes.add(key)
    continue
  }
  if (codes.has(code))
    throw new Error(`Two programmes would get the code ${code}`)
  codes.add(code)
  toCode.set(key, code)
  toCode.set(fields.name, code)
  toCode.set(clean(fields.name), code)
  if (key === code) continue
  change(`studyProgrammes/${code}`, null, record)
  change(`studyProgrammes/${key}`, record, null)
}
const recode = (value: unknown) =>
  typeof value === 'string' && !codes.has(value) ? toCode.get(value) : undefined

const unmatched = new Map<string, number>()
let students = 0
for (const [uid, user] of Object.entries(users)) {
  const stored = user?.studyProgram
  if (typeof stored !== 'string' || stored === '') continue
  const code = recode(stored)
  if (code) {
    change(`users/${uid}/studyProgram`, stored, code)
    students++
  } else if (!codes.has(stored)) {
    unmatched.set(stored, (unmatched.get(stored) ?? 0) + 1)
  }
}

let eventsMoved = 0
for (const [id, event] of Object.entries(events)) {
  const listed = event?.registration?.requirements?.programmes
  if (!Array.isArray(listed)) continue
  const next = listed.map((value) => recode(value) ?? value)
  if (next.every((value, i) => value === listed[i])) continue
  change(`events/${id}/registration/requirements/programmes`, listed, next)
  eventsMoved++
}

const moved = Object.keys(update).filter(
  (path) => path.startsWith('studyProgrammes/') && update[path] !== null,
).length
console.log(
  `${moved} programmes to key by code, ${students} students and ` +
    `${eventsMoved} events to point at codes.`,
)
for (const line of unknown)
  console.log(`programme not in the list, keeps its key: ${line}`)
for (const [value, count] of unmatched) {
  console.log(
    `students on a programme not found, kept as they are: ${value} (${count})`,
  )
}

if (apply && Object.keys(update).length > 0) {
  writeFileSync(backup!, JSON.stringify(before, null, 2))
  await db.ref().update(update)
  console.log(`Applied. What it replaced is in ${backup}.`)
} else if (!apply) {
  console.log(
    'Dry run. Run again with --apply --backup <file> to make the changes.',
  )
}
process.exit(0)
