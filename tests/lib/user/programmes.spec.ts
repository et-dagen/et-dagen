import { describe, expect, it } from 'vitest'
import { yearsOf } from '@/lib/user/programmes'

const programmes = [
  { name: 'Elektroingeniør', type: 'bachelor' },
  { name: 'Kybernetikk', type: 'master' },
  { name: 'Elektronisk systemdesign', type: 'integrated' },
]

describe('yearsOf', () => {
  it('offers the years each kind of programme has', () => {
    expect(yearsOf(programmes, 'Elektroingeniør')).toEqual([1, 2, 3])
    expect(yearsOf(programmes, 'Kybernetikk')).toEqual([4, 5])
    expect(yearsOf(programmes, 'Elektronisk systemdesign')).toEqual([
      1, 2, 3, 4, 5,
    ])
  })

  it('offers nothing before a programme is chosen', () => {
    expect(yearsOf(programmes, '')).toEqual([])
  })
})
