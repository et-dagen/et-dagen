import { ADMIN_PANELS, type AdminPanel } from '@/lib/admin/panels'

/** How many items each panel holds, for the navigation */
export async function usePanelCounts() {
  const counts = await Promise.all(
    ADMIN_PANELS.map(async ({ name, count }) => {
      if (!count) return [name, null] as const
      const { data } = await useFetch(count, {
        key: `admin-count-${name}`,
        transform: (items: unknown) => Object.keys(items ?? {}).length,
      })
      return [name, data] as const
    }),
  )
  return Object.fromEntries(counts) as Record<
    AdminPanel,
    Ref<number | null | undefined> | null
  >
}
