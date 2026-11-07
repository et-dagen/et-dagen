import { describe, expect, it } from 'vitest'
import { setFairDates } from '@/application/fair/dates'
import {
  addProgramme,
  listProgrammes,
  removeProgramme,
  updateProgramme,
} from '@/application/fair/programmes'
import type { Subject } from '@/domain/authorization/subject'
import { AppError } from '@/domain/errors'
import { WallClock } from '@/domain/fair/dates'
import { ProgrammeCode, type Programme } from '@/domain/fair/programme'
import { Instant } from '@/domain/time'
import { UserUid, type Role } from '@/domain/user'
import { memoryFairInfoRepository } from '@/server/adapters/memory/fairInfoRepository'
import { memoryProgrammeRepository } from '@/server/adapters/memory/programmeRepository'

const subject = (role: Role): Subject => ({
  uid: UserUid.parse(`${role}-1`),
  roles: [role],
  companies: new Map(),
  applicant: null,
})
const admin = subject('admin')
const now = Instant.parse('2026-11-07T10:00:00.000Z')

const mtel: Programme = {
  code: ProgrammeCode.parse('MTEL'),
  name: 'Elektronikk',
  degree: 'integrated',
  open: true,
}
const bel: Programme = {
  code: ProgrammeCode.parse('BELEKTRONIKK'),
  name: 'Elektronikk',
  degree: 'bachelor',
  open: true,
}
const setup = () => memoryProgrammeRepository([mtel, bel], { ada: 'MTEL' })

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => (error instanceof AppError ? error.code : error),
  )

describe('listProgrammes', () => {
  it('lists every programme by name, then code', async () => {
    const programmes = setup()
    expect(
      (await listProgrammes({ programmes })).map((programme) => programme.code),
    ).toEqual(['BELEKTRONIKK', 'MTEL'])
  })
})

describe('addProgramme', () => {
  const kyb: Programme = {
    code: ProgrammeCode.parse('MTTK'),
    name: 'Kybernetikk',
    degree: 'master',
    open: true,
  }

  it('adds a programme, even with a name another one has', async () => {
    const programmes = setup()
    const twin = { ...kyb, name: 'Elektronikk' }
    expect(
      await addProgramme(
        { programmes },
        { subject: admin, now, programme: twin },
      ),
    ).toEqual(twin)
    expect(await programmes.find(twin.code)).toEqual(twin)
  })

  it('refuses a code another programme has', async () => {
    expect(
      await codeOf(
        addProgramme(
          { programmes: setup() },
          { subject: admin, now, programme: { ...kyb, code: mtel.code } },
        ),
      ),
    ).toBe('programme/code-taken')
  })

  it('refuses anyone but an admin', async () => {
    expect(
      await codeOf(
        addProgramme(
          { programmes: setup() },
          { subject: subject('coordinator'), now, programme: kyb },
        ),
      ),
    ).toBe('auth/forbidden')
  })
})

describe('updateProgramme', () => {
  it('renames and closes a programme, keeping its code', async () => {
    const programmes = setup()
    const details = {
      name: 'Elektronisk systemdesign',
      degree: 'integrated',
      open: false,
    } as const

    expect(
      await updateProgramme(
        { programmes },
        { subject: admin, now, code: mtel.code, details },
      ),
    ).toEqual({ code: mtel.code, ...details })
    expect(await programmes.find(mtel.code)).toEqual({
      code: mtel.code,
      ...details,
    })
  })

  it('refuses an unknown code', async () => {
    expect(
      await codeOf(
        updateProgramme(
          { programmes: setup() },
          {
            subject: admin,
            now,
            code: ProgrammeCode.parse('NOPE'),
            details: mtel,
          },
        ),
      ),
    ).toBe('programme/not-found')
  })
})

describe('removeProgramme', () => {
  it('deletes a programme no student has', async () => {
    const programmes = setup()
    await removeProgramme(
      { programmes },
      { subject: admin, now, code: bel.code },
    )
    expect(await programmes.find(bel.code)).toBeNull()
  })

  it('refuses while a student has it', async () => {
    expect(
      await codeOf(
        removeProgramme(
          { programmes: setup() },
          { subject: admin, now, code: mtel.code },
        ),
      ),
    ).toBe('programme/in-use')
  })
})

describe('setFairDates', () => {
  const dates = {
    start: WallClock.tryParse('2027-02-09T11:00')!,
    end: WallClock.tryParse('2027-02-10T10:00')!,
  }

  it('stores the dates for an admin', async () => {
    const fair = memoryFairInfoRepository()
    await setFairDates({ fair }, { subject: admin, now, dates })
    expect(await fair.dates()).toEqual(dates)
  })

  it('refuses a student and a signed-out caller', async () => {
    const fair = memoryFairInfoRepository()
    expect(
      await codeOf(
        setFairDates({ fair }, { subject: subject('user'), now, dates }),
      ),
    ).toBe('auth/forbidden')
    expect(
      await codeOf(setFairDates({ fair }, { subject: undefined, now, dates })),
    ).toBe('auth/signed-out')
  })
})
