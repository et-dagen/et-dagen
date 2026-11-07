import { describe, expect, it } from 'vitest'
import { checkedProgrammeInput, sameName } from '@/domain/fair/programme'

describe('checkedProgrammeInput', () => {
  it('trims the name, collapses its spaces and keeps the programme open by default', () => {
    expect(
      checkedProgrammeInput({
        name: '  Elektronisk   systemdesign ',
        degree: 'master',
      }),
    ).toEqual({
      name: 'Elektronisk systemdesign',
      degree: 'master',
      open: true,
    })
  })

  it('closes a programme only when asked to', () => {
    expect(
      checkedProgrammeInput({
        name: 'MTEL',
        degree: 'integrated',
        open: false,
      }),
    ).toMatchObject({ open: false })
  })

  it('names the first problem', () => {
    expect(checkedProgrammeInput({ degree: 'master' })).toEqual({
      problem: 'programme/invalid-name',
    })
    expect(
      checkedProgrammeInput({ name: 'x'.repeat(121), degree: 'master' }),
    ).toEqual({
      problem: 'programme/invalid-name',
    })
    expect(checkedProgrammeInput({ name: 'MTEL', degree: 'phd' })).toEqual({
      problem: 'programme/invalid-degree',
    })
    expect(checkedProgrammeInput(null)).toEqual({
      problem: 'programme/invalid-name',
    })
  })
})

describe('sameName', () => {
  it('ignores case and accents, as a reader would', () => {
    expect(sameName('Elektronikk', 'elektronikk')).toBe(true)
    expect(sameName('Byggingeniør', 'Byggingenior')).toBe(false)
    expect(sameName('Elektronikk', 'Elektro')).toBe(false)
  })
})
