import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useListView } from '@/composables/admin/useListView'

interface Row {
  uid: string
  name: string
  kind: 'a' | 'b'
}

const rows = ref<Row[]>(
  Array.from({ length: 30 }, (_, i) => ({
    uid: `u${i}`,
    name: `Name ${String(i).padStart(2, '0')}`,
    kind: i % 3 === 0 ? 'b' : 'a',
  })),
)

const listOf = () =>
  useListView({
    rows,
    keyOf: (row) => row.uid,
    filter: {
      values: ['all', 'a', 'b'] as const,
      initial: 'all',
      keeps: (row, value) => value === 'all' || row.kind === value,
      label: (value) => value.toUpperCase(),
    },
    searchIn: (row) => [row.name],
    sortBy: { name: (row) => row.name },
    sortFirst: 'name',
    pageSize: 10,
  })

describe('useListView', () => {
  it('counts each filter, and pages what the filter and search keep', () => {
    const list = listOf()
    expect(list.filterOptions.value).toEqual([
      { value: 'all', label: 'ALL', count: 30 },
      { value: 'a', label: 'A', count: 20 },
      { value: 'b', label: 'B', count: 10 },
    ])
    expect(list.shown.value.rows.map((row) => row.uid)).toEqual(
      Array.from({ length: 10 }, (_, i) => `u${i}`),
    )
    list.filter.value = 'b'
    list.query.value = 'Name 2'
    expect(list.visible.value.map((row) => row.uid)).toEqual([
      'u12',
      'u21',
      'u24',
      'u27',
    ])
  })

  it('sorts by the chosen column, the other way on a second click', () => {
    const list = listOf()
    list.toggle('name')
    expect(list.shown.value.rows[0].uid).toBe('u29')
  })

  it('goes back to the first page when the search changes', async () => {
    const list = listOf()
    list.page.value = 3
    expect(list.shown.value.page).toBe(3)
    list.query.value = 'Name'
    await nextTick()
    expect(list.page.value).toBe(1)
  })

  it('keeps the selection across pages', () => {
    const list = listOf()
    list.selection.togglePage(true)
    list.page.value = 2
    list.selection.toggle(list.shown.value.rows[0], true)
    expect(list.chosen().map((row) => row.uid)).toEqual([
      ...Array.from({ length: 10 }, (_, i) => `u${i}`),
      'u10',
    ])
  })
})
