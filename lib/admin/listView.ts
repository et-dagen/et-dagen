export type SortDirection = 'asc' | 'desc'

type Text = string | null | undefined

/** Lower case without accents, so "Pröv" finds "prov" */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('nb')

/** The rows where every word of the query appears in one of the fields */
export function search<T>(
  rows: readonly T[],
  query: string,
  fields: (row: T) => readonly Text[],
): T[] {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return [...rows]
  return rows.filter((row) => {
    const haystack = fold(fields(row).filter(Boolean).join(' '))
    return words.every((word) => haystack.includes(word))
  })
}

const collator = new Intl.Collator('nb', { numeric: true, sensitivity: 'base' })

/** The rows ordered by one value in Norwegian alphabetical order; empty values go last */
export function sortBy<T>(
  rows: readonly T[],
  value: (row: T) => Text,
  direction: SortDirection,
): T[] {
  const sign = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const [x, y] = [value(a), value(b)]
    if (!x || !y) return x ? -1 : y ? 1 : 0
    return collator.compare(x, y) * sign
  })
}

export interface Page<T> {
  rows: T[]
  /** The page shown, counted from 1 */
  page: number
  pages: number
  /** Positions of the first and last row shown, counted from 1; 0 when there are none */
  from: number
  to: number
}

/** One page of rows; a page past the end shows the last one */
export function pageOf<T>(
  rows: readonly T[],
  page: number,
  size: number,
): Page<T> {
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const shown = Math.min(Math.max(1, page), pages)
  const start = (shown - 1) * size
  const slice = rows.slice(start, start + size)
  return {
    rows: slice,
    page: shown,
    pages,
    from: slice.length ? start + 1 : 0,
    to: start + slice.length,
  }
}
