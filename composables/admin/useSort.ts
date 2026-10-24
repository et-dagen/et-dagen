import type { SortDirection } from '@/lib/admin/listView'

/** Which column a list is sorted by; choosing the same column again reverses it */
export function useSort<C extends string>(
  column: C,
  direction: SortDirection = 'asc',
) {
  const sort = ref({ column, direction }) as Ref<{
    column: C
    direction: SortDirection
  }>

  const toggle = (next: C) => {
    const same = sort.value.column === next
    sort.value = {
      column: next,
      direction: same && sort.value.direction === 'asc' ? 'desc' : 'asc',
    }
  }

  /** The direction to show on a column, or null when the list is sorted by another */
  const directionOf = (c: C) =>
    sort.value.column === c ? sort.value.direction : null

  const ariaSort = (c: C) =>
    ({ asc: 'ascending', desc: 'descending', none: 'none' })[
      directionOf(c) ?? 'none'
    ]

  return { sort, toggle, directionOf, ariaSort }
}
