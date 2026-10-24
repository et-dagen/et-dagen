import type { Ref } from 'vue'

export type CheckState = boolean | 'indeterminate'

/**
 * Rows chosen by key, kept while the list is paged, searched or sorted
 *
 * @param visible The rows on screen, for the select-all box
 */
export function useSelection<T>(
  visible: Ref<readonly T[]>,
  keyOf: (row: T) => string,
) {
  const selected = ref(new Set<string>())

  const set = (keys: Iterable<string>, on: CheckState) => {
    const next = new Set(selected.value)
    for (const key of keys) {
      if (on === true) next.add(key)
      else next.delete(key)
    }
    selected.value = next
  }

  const toggle = (row: T, on: CheckState) => set([keyOf(row)], on)
  const has = (row: T) => selected.value.has(keyOf(row))
  const clear = () => (selected.value = new Set())

  /** The select-all box: ticked, empty, or a dash when only some rows on screen are chosen */
  const pageState = computed<CheckState>(() => {
    const chosen = visible.value.filter(has).length
    if (chosen === 0) return false
    return chosen === visible.value.length ? true : 'indeterminate'
  })
  const togglePage = (on: CheckState) => set(visible.value.map(keyOf), on)

  return { selected, toggle, has, clear, pageState, togglePage }
}
