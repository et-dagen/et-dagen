import { describe, expect, it } from 'vitest'
import {
  ProgrammeCode,
  checkedNewProgramme,
  checkedProgrammeDetails,
} from '@/domain/fair/programme'

describe('ProgrammeCode.tryParse', () => {
  it('reads a code in capitals', () => {
    expect(ProgrammeCode.tryParse(' mtel ')).toBe('MTEL')
    expect(ProgrammeCode.tryParse('BIELEKTRO2')).toBe('BIELEKTRO2')
    expect(ProgrammeCode.tryParse('mtiøt')).toBe('MTIØT')
  })

  it('refuses codes that do not start with a letter, are too short or carry other signs', () => {
    expect(ProgrammeCode.tryParse('0')).toBeNull()
    expect(ProgrammeCode.tryParse('M')).toBeNull()
    expect(ProgrammeCode.tryParse('MT-EL')).toBeNull()
    expect(ProgrammeCode.tryParse('A'.repeat(21))).toBeNull()
  })
})

describe('checkedProgrammeDetails', () => {
  it('trims the name, collapses its spaces and keeps the programme open by default', () => {
    expect(
      checkedProgrammeDetails({
        name: '  Elektronisk   systemdesign ',
        degree: 'master',
      }),
    ).toEqual({
      name: 'Elektronisk systemdesign',
      degree: 'master',
      open: true,
    })
  })

  it('names the first problem', () => {
    expect(checkedProgrammeDetails({ degree: 'master' })).toEqual({
      problem: 'programme/invalid-name',
    })
    expect(
      checkedProgrammeDetails({ name: 'x'.repeat(121), degree: 'master' }),
    ).toEqual({ problem: 'programme/invalid-name' })
    expect(checkedProgrammeDetails({ name: 'MTEL', degree: 'phd' })).toEqual({
      problem: 'programme/invalid-degree',
    })
  })
})

describe('checkedNewProgramme', () => {
  it('takes a code with the details, and closes only when asked to', () => {
    expect(
      checkedNewProgramme({
        code: 'mtel',
        name: 'Elektronikk',
        degree: 'integrated',
        open: false,
      }),
    ).toEqual({
      code: 'MTEL',
      name: 'Elektronikk',
      degree: 'integrated',
      open: false,
    })
  })

  it('needs a valid code first', () => {
    expect(
      checkedNewProgramme({ name: 'Elektronikk', degree: 'master' }),
    ).toEqual({
      problem: 'programme/invalid-code',
    })
    expect(checkedNewProgramme({ code: 'MTEL', degree: 'master' })).toEqual({
      problem: 'programme/invalid-name',
    })
  })
})
