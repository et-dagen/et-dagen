import { computed, ref, watch, type Ref } from 'vue'
import { useSelection } from '@/composables/admin/useSelection'
import { useSort } from '@/composables/admin/useSort'
import {
  pageOf,
  search,
  sortBy,
  type SortDirection,
} from '@/lib/admin/listView'

type Text = string | null | undefined
/** What a row is sorted by in one column */
type SortValue<T> = (row: T) => Text

interface Options<T, F extends string, C extends string> {
  rows: Ref<readonly T[]>
  keyOf: (row: T) => string
  /** The filter chips: their values, the one chosen first, and which rows each one keeps */
  filter: {
    values: readonly F[]
    initial: F
    keeps: (row: T, value: F) => boolean
    label: (value: F) => string
  }
  /** The fields the search box looks in */
  searchIn: (row: T) => readonly Text[]
  /** What each column sorts by, and the column sorted first */
  sortBy: Record<C, SortValue<T>>
  sortFirst: NoInfer<C>
  direction?: SortDirection
  pageSize?: number
}

/**
 * One admin list: filter chips with counts, search, a sortable header, pages and a selection
 * kept across them
 *
 * @remarks
 * Searching, filtering or sorting goes back to the first page. The selection holds rows by key,
 * so it survives paging.
 */
export function useListView<T, F extends string, C extends string>(
  options: Options<T, F, C>,
) {
  const query = ref('')
  const filter = ref(options.filter.initial) as Ref<F>
  const sort = useSort<C>(options.sortFirst, options.direction)
  const page = ref(1)

  const filterOptions = computed(() =>
    options.filter.values.map((value) => ({
      value,
      label: options.filter.label(value),
      count: options.rows.value.filter((row) =>
        options.filter.keeps(row, value),
      ).length,
    })),
  )

  const visible = computed(() => {
    const found = search(
      options.rows.value.filter((row) =>
        options.filter.keeps(row, filter.value),
      ),
      query.value,
      options.searchIn,
    )
    const { column, direction } = sort.sort.value
    return sortBy(found, options.sortBy[column], direction)
  })
  const shown = computed(() =>
    pageOf(visible.value, page.value, options.pageSize ?? 25),
  )
  watch([query, filter, sort.sort], () => (page.value = 1))

  const selection = useSelection(
    computed(() => shown.value.rows),
    options.keyOf,
  )
  /** The chosen rows, wherever they are in the list */
  const chosen = () => options.rows.value.filter(selection.has)

  return {
    query,
    filter,
    filterOptions,
    page,
    visible,
    shown,
    selection,
    chosen,
    ...sort,
  }
}
