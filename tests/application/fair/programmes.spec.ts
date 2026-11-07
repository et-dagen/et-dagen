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
import { ProgrammeId, type Programme } from '@/domain/fair/programme'
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
  id: ProgrammeId.parse('0'),
  name: 'MTEL',
  degree: 'integrated',
  open: true,
}
const bel: Programme = {
  id: ProgrammeId.parse('1'),
  name: 'Elektroingeniør',
  degree: 'bachelor',
  open: true,
}
const setup = () =>
  memoryProgrammeRepository([mtel, bel], { ada: 'MTEL', bo: 'Elektroingeniør' })

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => (error instanceof AppError ? error.code : error),
  )

describe('listProgrammes', () => {
  it('lists every programme by name', async () => {
    const programmes = setup()
    expect(
      (await listProgrammes({ programmes })).map((programme) => programme.name),
    ).toEqual(['Elektroingeniør', 'MTEL'])
  })
})

describe('addProgramme', () => {
  it('adds a programme with a new id', async () => {
    const programmes = setup()
    const input = { name: 'Kybernetikk', degree: 'master', open: true } as const

    const added = await addProgramme(
      { programmes },
      { subject: admin, now, input },
    )

    expect(added).toMatchObject(input)
    expect(await programmes.find(added.id)).toEqual(added)
  })

  it('refuses a name another programme has, whatever its case', async () => {
    const input = { name: 'mtel', degree: 'master', open: true } as const
    expect(
      await codeOf(
        addProgramme({ programmes: setup() }, { subject: admin, now, input }),
      ),
    ).toBe('programme/name-taken')
  })

  it('refuses anyone but an admin', async () => {
    const input = { name: 'Kybernetikk', degree: 'master', open: true } as const
    expect(
      await codeOf(
        addProgramme(
          { programmes: setup() },
          { subject: subject('coordinator'), now, input },
        ),
      ),
    ).toBe('auth/forbidden')
  })
})

describe('updateProgramme', () => {
  it('closes a programme without touching its students', async () => {
    const programmes = setup()
    const result = await updateProgramme(
      { programmes },
      { subject: admin, now, id: mtel.id, input: { ...mtel, open: false } },
    )
    expect(result).toEqual({ programme: { ...mtel, open: false }, moved: 0 })
    expect(programmes.programmeOf('ada')).toBe('MTEL')
  })

  it('moves the students along when the name changes', async () => {
    const programmes = setup()
    const input = {
      name: 'Elektronikk',
      degree: 'integrated',
      open: true,
    } as const

    const { moved } = await updateProgramme(
      { programmes },
      { subject: admin, now, id: mtel.id, input },
    )

    expect(moved).toBe(1)
    expect(programmes.programmeOf('ada')).toBe('Elektronikk')
  })

  it("refuses another programme's name and an unknown id", async () => {
    const programmes = setup()
    expect(
      await codeOf(
        updateProgramme(
          { programmes },
          { subject: admin, now, id: mtel.id, input: { ...bel } },
        ),
      ),
    ).toBe('programme/name-taken')
    expect(
      await codeOf(
        updateProgramme(
          { programmes },
          { subject: admin, now, id: ProgrammeId.parse('9'), input: mtel },
        ),
      ),
    ).toBe('programme/not-found')
  })
})

describe('removeProgramme', () => {
  it('deletes a programme no student has', async () => {
    const programmes = memoryProgrammeRepository([mtel])
    await removeProgramme({ programmes }, { subject: admin, now, id: mtel.id })
    expect(await programmes.all()).toEqual([])
  })

  it('refuses while a student has it', async () => {
    expect(
      await codeOf(
        removeProgramme(
          { programmes: setup() },
          { subject: admin, now, id: mtel.id },
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
