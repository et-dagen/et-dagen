import type { Panel } from '@/lib/admin/panels'

/** How many items each panel holds, for the navigation */
export async function usePanelCounts(panels: readonly Panel[]) {
  const counts = await Promise.all(
    panels.map(async ({ name, count }) => {
      if (!count) return [name, null] as const
      const { data } = await useFetch(count, {
        key: `admin-count-${name}`,
        transform: (items: unknown) => Object.keys(items ?? {}).length,
      })
      return [name, data] as const
    }),
  )
  return Object.fromEntries(counts) as Record<
    string,
    Ref<number | null | undefined> | null
  >
}
