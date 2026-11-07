import { describe, expect, it } from 'vitest'
import { fieldTime, programmeRows } from '@/lib/admin/programmes'

describe('programmeRows', () => {
  it('lists programmes by name and code, reading old records as the server does', () => {
    expect(
      programmeRows({
        MTEL: { name: 'Elektronikk', type: 'integrated' },
        BELEKTRONIKK: { name: 'Elektronikk', type: 'bachelor', closed: true },
        0: 'Akvakultur',
        X: { type: 'master' },
      }),
    ).toEqual([
      { code: '0', name: 'Akvakultur', degree: 'integrated', open: true },
      {
        code: 'BELEKTRONIKK',
        name: 'Elektronikk',
        degree: 'bachelor',
        open: false,
      },
      { code: 'MTEL', name: 'Elektronikk', degree: 'integrated', open: true },
    ])
    expect(programmeRows(null)).toEqual([])
  })
})

describe('fieldTime', () => {
  it('drops the seconds a datetime field does not show', () => {
    expect(fieldTime('2027-02-09T11:00:00')).toBe('2027-02-09T11:00')
    expect(fieldTime(undefined)).toBe('')
  })
})
