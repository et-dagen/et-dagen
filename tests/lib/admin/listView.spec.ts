import { describe, expect, it } from 'vitest'
import { pageOf, search, sortBy } from '@/lib/admin/listView'

const people = [
  { name: 'Øystein Ås', email: 'oystein@example.com' },
  { name: 'Ada Lovelace', email: 'ada@example.com' },
  { name: 'Åse Berg', email: null },
  { name: 'bo Eng', email: 'bo@example.com' },
]
const fields = (p: (typeof people)[number]) => [p.name, p.email]

describe('search', () => {
  it('finds rows containing every word, in any field, ignoring case', () => {
    expect(search(people, 'ADA example', fields)).toEqual([people[1]])
  })

  it('ignores accents, so plain letters find accented names', () => {
    expect(search(people, 'ase', fields).map((p) => p.name)).toEqual([
      'Åse Berg',
    ])
  })

  it('keeps every row for an empty query', () => {
    expect(search(people, '  ', fields)).toHaveLength(4)
  })
})

describe('sortBy', () => {
  it('sorts in Norwegian order, with Æ, Ø and Å last', () => {
    expect(sortBy(people, (p) => p.name, 'asc').map((p) => p.name)).toEqual([
      'Ada Lovelace',
      'bo Eng',
      'Øystein Ås',
      'Åse Berg',
    ])
  })

  it('puts empty values last in both directions', () => {
    expect(sortBy(people, (p) => p.email, 'desc').at(-1)?.name).toBe('Åse Berg')
    expect(sortBy(people, (p) => p.email, 'asc').at(-1)?.name).toBe('Åse Berg')
  })
})

describe('pageOf', () => {
  const rows = Array.from({ length: 23 }, (_, i) => i + 1)

  it('returns one page with the positions it covers', () => {
    expect(pageOf(rows, 3, 10)).toEqual({
      rows: [21, 22, 23],
      page: 3,
      pages: 3,
      from: 21,
      to: 23,
    })
  })

  it('shows the last page when asked for one past the end', () => {
    expect(pageOf(rows, 9, 10).page).toBe(3)
  })

  it('has one empty page when there are no rows', () => {
    expect(pageOf([], 1, 10)).toEqual({
      rows: [],
      page: 1,
      pages: 1,
      from: 0,
      to: 0,
    })
  })
})
