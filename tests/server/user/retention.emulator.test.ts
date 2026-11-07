/**
 * Runs the retention job against the Auth, Realtime Database and Storage emulators
 *
 * Needs the emulator hosts, which `bun run test:api` sets; skipped without them.
 */
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DATABASE_NAMESPACE,
  PROJECT_ID,
  resetEmulators,
} from '@/tests/api/support/emulators'
import { Instant } from '@/domain/time'
import { memoryMailer } from '@/server/adapters/memory/mailer'
import { runRetention } from '@/server/user/retention'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST
const now = Instant.parse('2026-10-24T03:00:00.000Z')

describe.skipIf(!host)('retention job on the emulators', () => {
  const app = initializeApp(
    {
      projectId: PROJECT_ID,
      databaseURL: `http://${host}?ns=${DATABASE_NAMESPACE}`,
      storageBucket: `${PROJECT_ID}.appspot.com`,
    },
    'retention',
  )
  const auth = getAuth(app)
  const db = getDatabase(app)
  const bucket = getStorage(app).bucket()

  beforeEach(async () => {
    await resetEmulators()
    await auth.importUsers([
      {
        uid: 'stale',
        metadata: {
          creationTime: '2020-06-01T10:00:00.000Z',
          lastSignInTime: '2023-10-23T10:00:00.000Z',
        },
      },
      {
        uid: 'due',
        email: 'due@example.com',
        metadata: {
          creationTime: '2020-06-01T10:00:00.000Z',
          lastSignInTime: '2023-11-10T10:00:00.000Z',
        },
      },
      {
        uid: 'recent',
        metadata: {
          creationTime: '2020-06-01T10:00:00.000Z',
          lastSignInTime: '2023-10-25T10:00:00.000Z',
        },
      },
    ])
    await db.ref('users').set({ stale: { name: 'S' }, recent: { name: 'R' } })
    await bucket.file('users/stale/cv.pdf').save('%PDF')
    await bucket.file('users/recent/cv.pdf').save('%PDF')
  })

  it('erases only the users whose last sign-in is more than three years ago', async () => {
    const counts = await runRetention(
      { db, files: bucket, auth, mailer: null },
      now,
    )

    expect(counts.erased).toBe(1)
    const { users } = await auth.listUsers()
    expect(users.map((user) => user.uid).sort()).toEqual(['due', 'recent'])
    expect((await db.ref('users').once('value')).val()).toEqual({
      recent: { name: 'R' },
    })
    // the storage emulator is shared with other tests, so look only at these two users
    const namesUnder = async (prefix: string) =>
      (await bucket.getFiles({ prefix }))[0].map((file) => file.name)
    expect(await namesUnder('users/stale/')).toEqual([])
    expect(await namesUnder('users/recent/')).toEqual(['users/recent/cv.pdf'])
  })

  it('warns a user within 30 days of the limit once, and erasure forgets it', async () => {
    const mailer = memoryMailer()

    await runRetention({ db, files: bucket, auth, mailer }, now)
    await runRetention({ db, files: bucket, auth, mailer }, now)

    expect(mailer.sent.map((mail) => mail.to)).toEqual(['due@example.com'])
    expect((await db.ref('retention').once('value')).val()).toEqual({
      due: now,
    })

    const later = Instant.parse('2026-11-10T10:00:00.000Z')
    await runRetention({ db, files: bucket, auth, mailer }, later)
    expect((await db.ref('retention').once('value')).val()).toBeNull()
  })
})
