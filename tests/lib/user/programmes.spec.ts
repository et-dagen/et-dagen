import { describe, expect, it } from 'vitest'
import {
  programmeCode,
  programmeLabel,
  programmeName,
  programmesOf,
  yearsOf,
} from '@/lib/user/programmes'

const programmes = [
  { code: 'BIELEKTRO', name: 'Elektroingeniør', type: 'bachelor' },
  { code: 'MTTK', name: 'Kybernetikk', type: 'master' },
  { code: 'MTEL', name: 'Elektronisk systemdesign', type: 'integrated' },
]

describe('yearsOf', () => {
  it('offers the years each kind of programme has, by code or by an old name', () => {
    expect(yearsOf(programmes, 'BIELEKTRO')).toEqual([1, 2, 3])
    expect(yearsOf(programmes, 'Kybernetikk')).toEqual([4, 5])
    expect(yearsOf(programmes, 'MTEL')).toEqual([1, 2, 3, 4, 5])
  })

  it('offers nothing before a programme is chosen', () => {
    expect(yearsOf(programmes, '')).toEqual([])
  })
})

describe('programmeName and programmeCode', () => {
  it('read a stored code or a name from before codes', () => {
    expect(programmeName(programmes, 'MTTK')).toBe('Kybernetikk')
    expect(programmeName(programmes, 'Kybernetikk')).toBe('Kybernetikk')
    expect(programmeCode(programmes, 'Kybernetikk')).toBe('MTTK')
    expect(programmeCode(programmes, 'MTTK')).toBe('MTTK')
  })

  it('show what is stored when the list does not know it', () => {
    expect(programmeName(programmes, 'Gammelt program')).toBe('Gammelt program')
    expect(programmeName(programmes, null)).toBe('')
  })

  it('find a code before a name, when another programme is named like the code', () => {
    const confusing = [...programmes, { code: 'X', name: 'MTEL' }]
    expect(programmeName(confusing, 'MTEL')).toBe('Elektronisk systemdesign')
  })
})

describe('programmesOf', () => {
  it('sorts the named programmes by name, keeps each code and reads old bare names', () => {
    expect(
      programmesOf({
        MTTK: { name: 'Kybernetikk', type: 'master', closed: true },
        0: 'Elektroingeniør',
        c: { type: 'bachelor' },
      }),
    ).toEqual([
      { code: '0', name: 'Elektroingeniør' },
      { code: 'MTTK', name: 'Kybernetikk', type: 'master', closed: true },
    ])
    expect(programmesOf(null)).toEqual([])
  })
})

describe('programmeLabel', () => {
  const twins = [
    { code: 'BELEKTRONIKK', name: 'Elektronikk', type: 'bachelor' },
    { code: 'MTEL', name: 'Elektronikk', type: 'integrated' },
    { code: 'MTTK', name: 'Kybernetikk', type: 'master' },
  ]
  const degree = (type: string) => `[${type}]`

  it('adds the degree only when another programme shares the name', () => {
    expect(programmeLabel(twins, twins[0]!, degree)).toBe(
      'Elektronikk ([bachelor])',
    )
    expect(programmeLabel(twins, twins[2]!, degree)).toBe('Kybernetikk')
    expect(programmeName(twins, 'MTEL', degree)).toBe(
      'Elektronikk ([integrated])',
    )
  })
})
