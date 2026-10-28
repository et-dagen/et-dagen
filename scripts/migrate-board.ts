/**
 * Move the board from the contact page's code into the database and the bucket
 *
 * The contact page used to list the board in `pages/contact.vue`, with photos under
 * `public/images/board/`. This stores those members under `board/` and their portraits as fair
 * files, cropped to 800 x 960 like an upload in the admin. Run it once against production before
 * releasing the contact page that reads `GET /api/v1/board`. It refuses to run when the board is
 * not empty, so it never adds the members twice.
 *
 *   bun --env-file=.env scripts/migrate-board.ts           # dry run: list what would be stored
 *   bun --env-file=.env scripts/migrate-board.ts --apply   # store it
 *
 * The photos are read from git at the release that still has them (`--ref`, default
 * `release-2026-10-25`). Reads the same NUXT_FIREBASE_ADMIN_* variables as the server, or runs
 * against the emulators when FIREBASE_DATABASE_EMULATOR_HOST is set.
 */
import { execFileSync } from 'node:child_process'
import { cert, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import { uploadFile } from '@/application/files/uploadFile'
import {
  BoardMemberId,
  PhoneNumber,
  PORTRAIT,
  type BoardMember,
} from '@/domain/board/member'
import { EmailAddress } from '@/domain/email'
import { Instant } from '@/domain/time'
import { firebaseFileStorage } from '@/server/adapters/firebase/fileStorage'
import { rtdbBoardRepository } from '@/server/adapters/rtdb/boardRepository'
import { rtdbFileRepository } from '@/server/adapters/rtdb/fileRepository'
import { sharpImageProcessor } from '@/server/adapters/sharp/imageProcessor'
import en from '@/i18n/locales/en-GB.json'
import nb from '@/i18n/locales/nb-NO.json'

/** The board as `pages/contact.vue` listed it at the release, in its order */
const BOARD = [
  ['Fredrik Sanner', 'head', 'leder@et-dagen.no', '+47 412 89 452', 'manager'],
  [
    'Vegard Geirsson Ultveit',
    'deputyHead',
    'nestleder@et-dagen.no',
    '+47 483 44 104',
    'deputy_manager',
  ],
  ['Eirik Hoel', 'finance', 'okonomi@et-dagen.no', '+47 953 07 334', 'finance'],
  [
    'Even Gjerde',
    'logistics',
    'logistikk@et-dagen.no',
    '+47 969 00 876',
    'logistics',
  ],
  [
    'William Bryde',
    'business',
    'bedriftansvarlig@et-dagen.no',
    '+47 995 41 223',
    'business',
  ],
  ['Ruben Johnsen', 'spons', 'spons@et-dagen.no', '+47 469 44 567', 'sponsor'],
  [
    'Anna Lina Hollum',
    'marketing',
    'mfansvarlig@et-dagen.no',
    '+47 977 47 450',
    'marketing',
  ],
  [
    'Selma Olsen Storbugt',
    'IT',
    'itansvarlig@et-dagen.no',
    '+47 412 89 917',
    'it',
  ],
  [
    'Elias Møinichen Alsos',
    'travel',
    'turansvarlig@et-dagen.no',
    '+47 941 74 073',
    'travel',
  ],
] as const

/** The contact page showed the business manager on their own, for companies */
const FEATURED = 'business'

const apply = process.argv.includes('--apply')
const refAt = process.argv.indexOf('--ref')
const ref = refAt > 0 ? process.argv[refAt + 1]! : 'release-2026-10-25'

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

const board = rtdbBoardRepository(getDatabase(app))
const files = rtdbFileRepository(getDatabase(app))
const storage = firebaseFileStorage(getStorage(app).bucket())
const images = sharpImageProcessor()

if ((await board.all()).length > 0) {
  console.error('The board already has members; nothing was changed.')
  process.exit(1)
}

const positions = (locale: { contact: { positions: object } }) =>
  locale.contact.positions as Record<string, string>

const members: BoardMember[] = []
for (const [order, [name, role, email, phone, photo]] of BOARD.entries()) {
  const original = execFileSync('git', [
    'show',
    `${ref}:public/images/board/${photo}.jpg`,
  ])
  const fitted = await images.fit(new Uint8Array(original), PORTRAIT)
  if (!fitted) throw new Error(`Could not read the photo of ${name}`)

  const member: BoardMember = {
    id: BoardMemberId.random(),
    name,
    title: { nb: positions(nb)[role]!, en: positions(en)[role]! },
    email: EmailAddress.parse(email),
    phone: PhoneNumber.tryParse(phone),
    photo: null,
    featured: role === FEATURED,
    order,
  }
  console.log(
    `${apply ? 'storing' : 'would store'}: ${order} ${name}, ${member.title.nb}, ` +
      `photo ${original.byteLength} -> ${fitted.bytes.byteLength} bytes`,
  )
  if (apply) {
    const file = await uploadFile(
      {
        kind: 'portrait',
        owner: { kind: 'fair' },
        uploader: null,
        name: `${photo}.jpg`,
        contentType: fitted.contentType,
        bytes: fitted.bytes,
      },
      { files, storage, now: Instant.now },
    )
    member.photo = file.id
  }
  members.push(member)
}

if (apply) await board.save(members)
console.log(
  `${members.length} board members ${apply ? 'stored' : 'checked'}.${
    apply ? '' : ' Run again with --apply to store them.'
  }`,
)
process.exit(0)
