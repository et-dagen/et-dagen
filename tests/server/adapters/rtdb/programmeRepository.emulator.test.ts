/**
 * Runs the ProgrammeRepository contract against the Realtime Database emulator, and checks the
 * records v1 left behind and the fair's dates
 *
 * Needs `FIREBASE_DATABASE_EMULATOR_HOST`, which `bun run test:api` sets; skipped without it.
 */
import { initializeApp } from 'firebase-admin/app'
import { getDatabase } from 'firebase-admin/database'
import { describe, expect, it } from 'vitest'
import { describeProgrammeRepository } from '@/tests/application/fair/programmeRepository.contract'
import { WallClock } from '@/domain/fair/dates'
import { rtdbFairInfoRepository } from '@/server/adapters/rtdb/fairInfoRepository'
import { rtdbProgrammeRepository } from '@/server/adapters/rtdb/programmeRepository'

const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST

describe.skipIf(!host)('Realtime Database emulator', () => {
  const db = getDatabase(
    initializeApp(
      {
        projectId: 'demo-et-dagen',
        databaseURL: `http://${host}?ns=demo-et-dagen-default-rtdb`,
      },
      'programme-repository-contract',
    ),
  )

  describeProgrammeRepository('rtdb', async (seed, students) => {
    await db
      .ref('studyProgrammes')
      .set(
        Object.fromEntries(
          seed.map(({ id, name, degree, open }) => [
            id,
            { name, type: degree, ...(!open && { closed: true }) },
          ]),
        ),
      )
    await db
      .ref('users')
      .set(
        Object.fromEntries(
          Object.entries(students).map(([uid, studyProgram]) => [
            uid,
            { name: uid, studyProgram },
          ]),
        ),
      )
    return {
      programmes: rtdbProgrammeRepository(db),
      programmeOf: async (uid) =>
        (await db.ref(`users/${uid}/studyProgram`).once('value')).val() ??
        undefined,
    }
  })

  it('reads bare names and unknown types as programmes offering every year', async () => {
    await db
      .ref('studyProgrammes')
      .set({ 0: 'MTEL', 1: { name: 'X', type: 'phd' } })
    const programmes = await rtdbProgrammeRepository(db).all()
    expect(programmes.map((p) => [p.name, p.degree, p.open])).toEqual([
      ['MTEL', 'integrated', true],
      ['X', 'integrated', true],
    ])
  })

  it("keeps the fair's dates where the landing page reads them", async () => {
    await db.ref('generalInfo').remove()
    const fair = rtdbFairInfoRepository(db)
    expect(await fair.dates()).toBeNull()

    const dates = {
      start: WallClock.tryParse('2027-02-09T11:00')!,
      end: WallClock.tryParse('2027-02-10T10:00')!,
    }
    await fair.setDates(dates)

    expect(await fair.dates()).toEqual(dates)
    expect((await db.ref('generalInfo/date').once('value')).val()).toEqual({
      start: '2027-02-09T11:00:00',
      end: '2027-02-10T10:00:00',
    })
  })
})
